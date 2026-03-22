import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Search, Eye, ArrowUpDown, Calendar, ArrowLeft,
    TrendingUp, ShoppingBag, CreditCard, X, Receipt, ChevronRight
} from 'lucide-react';
import styles from '../MouthSum/MouthSum.module.css';

// ✅ Use env variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ✅ Auth header helper
const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const MouthSum = () => {
    const navigate = useNavigate();
    const [orders, setOrders]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [searchTerm, setSearchTerm]   = useState('');
    const [sortDir, setSortDir]         = useState('desc');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear]   = useState(now.getFullYear());

    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const yearOptions = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

    // ✅ Redirect if no token
    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/login');
    }, [navigate]);

    const getDateRange = useCallback(() => {
        const mm       = String(selectedMonth).padStart(2, '0');
        const startDate = `${selectedYear}-${mm}-01`;
        const lastDay  = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate  = `${selectedYear}-${mm}-${lastDay}`;
        return { startDate, endDate };
    }, [selectedMonth, selectedYear]);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRange();

            // ✅ Auth header
            const response = await axios.get(`${API_BASE}/sales`, {
                params: { startDate, endDate, search: searchTerm },
                ...getAuthHeader()
            });

            if (response.data && response.data.success) {
                setOrders(response.data.data);
            }
        } catch (err) {
            console.error('Fetch orders error:', err);
            // ✅ Handle expired token
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [searchTerm, getDateRange, navigate]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleViewDetail = async (id) => {
        try {
            setIsModalOpen(true);
            setModalLoading(true);

            // ✅ Auth header
            const response = await axios.get(
                `${API_BASE}/sales/${id}`,
                getAuthHeader()
            );

            if (response.data && response.data.success) {
                setSelectedOrder(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching order details:', err);
            // ✅ Handle expired token
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            alert('ไม่พบข้อมูลบิล หรือ Server เกิดข้อผิดพลาด');
            setIsModalOpen(false);
        } finally {
            setModalLoading(false);
        }
    };

    const totalRevenue  = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders   = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const sortedOrders = [...orders].sort((a, b) => {
        const diff = new Date(a.createdAt) - new Date(b.createdAt);
        return sortDir === 'asc' ? diff : -diff;
    });

    return (
        <div className={styles.page}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />

            <div className={styles.inner}>
                <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={16} /><span>กลับ Dashboard</span>
                </button>

                <header className={styles.header}>
                    <div className={styles.titleBlock}>
                        <div className={styles.titleBadge}>
                            <Calendar size={12} /><span>Monthly</span>
                        </div>
                        <h1 className={styles.title}>สรุปยอดขายรายเดือน</h1>
                        <p className={styles.subtitle}>
                            ประจำเดือน {thaiMonths[selectedMonth - 1]} {selectedYear + 543}
                        </p>
                    </div>
                </header>

                <div className={styles.summaryStrip}>
                    <div className={styles.summaryItem}>
                        <ShoppingBag size={16} />
                        <span>จำนวนออเดอร์</span>
                        <strong>{totalOrders.toLocaleString()} รายการ</strong>
                    </div>
                    <div className={styles.stripDivider} />
                    <div className={styles.summaryItem}>
                        <TrendingUp size={16} />
                        <span>ยอดขายรวม</span>
                        <strong className={styles.greenText}>฿{totalRevenue.toLocaleString()}</strong>
                    </div>
                    <div className={styles.stripDivider} />
                    <div className={styles.summaryItem}>
                        <CreditCard size={16} />
                        <span>ยอดเฉลี่ยต่อบิล</span>
                        <strong className={styles.violetText}>
                            ฿{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </strong>
                    </div>
                </div>

                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="ค้นหาเลขที่บิล..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.dateGroup}>
                        <Calendar size={15} className={styles.calIcon} />
                        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className={styles.selectInput}>
                            {thaiMonths.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className={styles.selectInput}>
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y + 543}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>เลขที่ออเดอร์</th>
                                <th>วันที่</th>
                                <th>
                                    <button className={styles.sortBtn} onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                                        เวลา <ArrowUpDown size={13} />
                                    </button>
                                </th>
                                <th>วิธีการชำระเงิน</th>
                                <th>ยอดรวมสุทธิ</th>
                                <th>สถานะ</th>
                                <th style={{ textAlign: 'center' }}>รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className={styles.emptyRow}>
                                    <div className={styles.loadingDots}><span /><span /><span /></div>
                                </td></tr>
                            ) : sortedOrders.length > 0 ? sortedOrders.map((order, i) => {
                                const dt = new Date(order.createdAt);
                                return (
                                    <tr key={order.id} className={styles.tableRow} style={{ animationDelay: `${i * 25}ms` }}>
                                        <td><span className={styles.orderNo}>#{order.orderNumber}</span></td>
                                        <td className={styles.dateCell}>
                                            {dt.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className={styles.timeCell}>
                                            {dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                        </td>
                                        <td>
                                            <span className={styles.paymentTag}>{order.paymentMethod || 'ไม่ระบุ'}</span>
                                        </td>
                                        <td className={styles.amountCell}>฿{Number(order.totalAmount).toLocaleString()}</td>
                                        <td><span className={styles.statusBadge}>สำเร็จ</span></td>
                                        <td className={styles.actionCell}>
                                            <button className={styles.viewBtn} onClick={() => handleViewDetail(order.id)}>
                                                <Eye size={15} /><span>ดู</span><ChevronRight size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7" className={styles.emptyRow}>
                                    ไม่มีรายการขายในเดือนนี้
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitleGroup}>
                                <Receipt size={18} className={styles.modalIcon} />
                                <div>
                                    <h2>รายละเอียดบิล</h2>
                                    {selectedOrder && <p>#{selectedOrder.sale_id}</p>}
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {modalLoading ? (
                                <div className={styles.modalLoading}>
                                    <div className={styles.loadingDots}><span /><span /><span /></div>
                                    <p>กำลังโหลดรายละเอียด...</p>
                                </div>
                            ) : selectedOrder ? (
                                <>
                                    <div className={styles.metaGrid}>
                                        <div className={styles.metaItem}>
                                            <span>วันที่</span>
                                            <strong>{new Date(selectedOrder.sale_date).toLocaleString('th-TH')}</strong>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span>ชำระด้วย</span>
                                            <strong>{selectedOrder.payment_method}</strong>
                                        </div>
                                    </div>
                                    <div className={styles.itemsSection}>
                                        <p className={styles.itemsLabel}>รายการสินค้า</p>
                                        <div className={styles.itemsList}>
                                            {selectedOrder.items?.map((item, i) => (
                                                <div key={i} className={styles.itemRow}>
                                                    <div className={styles.itemName}>
                                                        <div className={styles.itemDot} />
                                                        <span>{item.product_name}</span>
                                                    </div>
                                                    <div className={styles.itemMeta}>
                                                        <span className={styles.itemQty}>{item.quantity} ×</span>
                                                        <span className={styles.itemPrice}>฿{Number(item.unit_price).toLocaleString()}</span>
                                                        <span className={styles.itemSubtotal}>฿{Number(item.subtotal).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.totalRow}>
                                        <span>ยอดรวมสุทธิ</span>
                                        <strong className={styles.totalAmount}>฿{Number(selectedOrder.total_amount).toLocaleString()}</strong>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MouthSum;