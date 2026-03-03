import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Search, Calendar, Eye, FileText, Download, ArrowUpDown
} from 'lucide-react';
import styles from './OrderList.module.css';

const OrderList = () => {
    const location = useLocation();

    // 1. State สำหรับจัดการข้อมูลและการกรอง
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({
        // รับค่าเริ่มต้นจาก Dashboard หรือตั้งค่าเป็น 30 วันย้อนหลัง
        startDate: location.state?.startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: location.state?.endDate || new Date().toISOString().split('T')[0]
    });

    // 2. ฟังก์ชันดึงข้อมูลจาก API
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/sales', {
                params: {
                    startDate: dateFilter.startDate,
                    endDate: dateFilter.endDate,
                    search: searchTerm
                }
            });

            if (response.data && response.data.success) {
                // ข้อมูลจะถูก map มาจาก Backend (id, orderNumber, totalAmount, paymentMethod, createdAt)
                setOrders(response.data.data);
            }
        } catch (err) {
            console.error("Fetch orders error:", err);
        } finally {
            setLoading(false);
        }
    }, [dateFilter, searchTerm]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // 3. ฟังก์ชันจัดการการเปลี่ยนวันที่
    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateFilter(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={styles.pageContainer}>
            {/* Header Area */}
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>รายการคำสั่งซื้อทั้งหมด</h1>
                    <p>ตรวจสอบและจัดการประวัติการขายในระบบ</p>
                </div>
                <button className={styles.exportBtn} onClick={() => window.print()}>
                    <Download size={18} />
                    <span>พิมพ์รายงาน</span>
                </button>
            </header>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchGroup}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาเลขที่บิล..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.dateGroup}>
                    <div className={styles.dateField}>
                        <Calendar size={16} />
                        <input 
                            type="date" 
                            name="startDate"
                            value={dateFilter.startDate}
                            onChange={handleDateChange}
                        />
                    </div>
                    <span className={styles.dateDivider}>ถึง</span>
                    <div className={styles.dateField}>
                        <Calendar size={16} />
                        <input 
                            type="date" 
                            name="endDate"
                            value={dateFilter.endDate}
                            onChange={handleDateChange}
                        />
                    </div>
                </div>
            </div>
            
            <div className={styles.tableWrapper}>
                <table className={styles.mainTable}>
                    <thead>
                        <tr>
                            <th>เลขที่ออเดอร์ <ArrowUpDown size={14} /></th>
                            <th>วันที่สั่งซื้อ</th>
                            <th>วิธีการชำระเงิน</th>
                            <th>ยอดรวมสุทธิ</th>
                            <th>สถานะ</th>
                            <th style={{ textAlign: 'center' }}>การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && orders.length > 0 ? (
                            orders.map((order) => (
                                <tr key={order.id}>
                                    <td className={styles.orderNo}>#{order.orderNumber}</td>
                                    <td>{new Date(order.createdAt).toLocaleString('th-TH')}</td>
                                    <td>
                                        <div className={styles.paymentCell}>
                                            {order.paymentMethod || 'ไม่ระบุ'}
                                        </div>
                                    </td>
                                    <td className={styles.amount}>฿{Number(order.totalAmount).toLocaleString()}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles.statusPaid}`}>
                                            สำเร็จ
                                        </span>
                                    </td>
                                    <td className={styles.actionCell}>
                                        <button className={styles.iconBtn} title="ดูรายละเอียด"><Eye size={18} /></button>
                                        <button className={styles.iconBtn} title="พิมพ์ใบเสร็จ"><FileText size={18} /></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className={styles.emptyRow}>
                                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลคำสั่งซื้อ'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderList;
