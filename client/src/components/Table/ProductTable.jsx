import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Search, Filter, FileSpreadsheet, Plus, Trash2,
    Package, ArrowUpDown, Tag, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './Table.module.css';
import StockBadge from '../StockBadge/StockBadge';
import ProductImage from '../ProductImage/ProductImage';

// ✅ Use env variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ✅ Auth header helper
const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const formatCurrency = (amount) =>
    new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2 }).format(amount || 0);

const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    return new Intl.DateTimeFormat('th-TH', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(dateString));
};

const getStockStatus = (stock, minStock, trackStock = true) => {
    if (!trackStock) return 'untracked';
    if (stock <= 0) return 'out_of_stock';
    if (stock <= minStock) return 'low';
    return 'normal';
};

const ConfirmToast = ({ productName, onConfirm, onCancel }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

    const handleCancel = () => { setVisible(false); setTimeout(onCancel, 250); };
    const handleConfirm = () => { setVisible(false); setTimeout(onConfirm, 250); };

    return (
        <div
            onClick={handleCancel}
            style={{
                position: 'fixed', inset: 0,
                background: `rgba(0,0,0,${visible ? '0.6' : '0'})`,
                zIndex: 9998,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.25s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    transform: `translateY(${visible ? '0' : '-16px'})`,
                    opacity: visible ? 1 : 0,
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                    padding: '20px 22px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    minWidth: '340px', maxWidth: '90vw',
                }}
            >
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'rgba(251,113,133,0.12)',
                    border: '1px solid rgba(251,113,133,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Trash2 size={17} color="#fb7185" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#e2e8f0', fontFamily: 'Sarabun, sans-serif' }}>
                        ลบสินค้านี้ใช่หรือไม่?
                    </p>
                    <p style={{
                        margin: '3px 0 0', fontSize: '13px', color: '#475569',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: 'Sarabun, sans-serif',
                    }}>
                        {productName}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={handleCancel} style={{
                        padding: '8px 18px', borderRadius: '9px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 600, color: '#94a3b8',
                        fontFamily: 'Sarabun, sans-serif',
                    }}>ยกเลิก</button>
                    <button onClick={handleConfirm} style={{
                        padding: '8px 18px', borderRadius: '9px',
                        border: '1px solid rgba(251,113,133,0.3)',
                        background: 'rgba(251,113,133,0.15)',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                        color: '#fb7185', fontFamily: 'Sarabun, sans-serif',
                    }}>ลบ</button>
                </div>
            </div>
        </div>
    );
};

function ProductTable() {
    const navigate = useNavigate();
    const [allProducts, setAllProducts]     = useState([]);
    const [deleting, setDeleting]           = useState(null);
    const [loading, setLoading]             = useState(true);
    const [filterStatus, setFilterStatus]   = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm]       = useState('');
    const [sortDir, setSortDir]             = useState('asc');
    const [confirmToast, setConfirmToast]   = useState(null);

    // ✅ Redirect if no token
    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/login');
    }, [navigate]);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            // ✅ Send auth header
            const res = await axios.get(`${API_BASE}/products`, getAuthHeader());
            setAllProducts(res.data.data ?? []);
        } catch (err) {
            console.error(err);
            // ✅ Handle expired token
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleDelete = useCallback((id, productName, event) => {
        event.stopPropagation();
        setConfirmToast({ id, name: productName });
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        const { id } = confirmToast;
        setConfirmToast(null);
        try {
            setDeleting(id);
            // ✅ Send auth header
            await axios.delete(`${API_BASE}/products/${id}`, getAuthHeader());
            setAllProducts(prev => prev.filter(p => p.products_id !== id));
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        } finally {
            setDeleting(null);
        }
    }, [confirmToast, navigate]);

    const categories = useMemo(() =>
        [...new Set(allProducts.map(p => p.category_name).filter(Boolean))].sort(),
        [allProducts]
    );

    const filteredProducts = useMemo(() => {
        const list = allProducts.filter(p => {
            const status      = getStockStatus(p.products_stock, p.min_stock_level ?? 10, p.track_stock);
            const matchSearch = p.products_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat    = filterCategory === 'all' || p.category_name === filterCategory;
            const matchStatus = filterStatus === 'all' || status === filterStatus;
            return matchSearch && matchCat && matchStatus;
        });
        return list.sort((a, b) =>
            sortDir === 'asc'
                ? a.products_name.localeCompare(b.products_name, 'th')
                : b.products_name.localeCompare(a.products_name, 'th')
        );
    }, [allProducts, filterStatus, filterCategory, searchTerm, sortDir]);

    const totalProducts = allProducts.length;
    const lowStock    = allProducts.filter(p => p.track_stock && p.products_stock > 0 && p.products_stock <= (p.min_stock_level ?? 10)).length;
    const outOfStock  = allProducts.filter(p => p.track_stock && p.products_stock <= 0).length;

    const exportToExcel = useCallback(() => {
        const dataToExport = filteredProducts.map(p => ({
            'รหัสสินค้า' : p.products_id,
            'ชื่อสินค้า'  : p.products_name,
            'หมวดหมู่'    : p.category_name || 'ไม่มีหมวดหมู่',
            'ราคา'        : p.products_price,
            'จำนวน'       : p.track_stock ? p.products_stock : '∞',
            'อัปเดตเมื่อ'  : formatDateTime(p.updated_at),
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        worksheet['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 16 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
        XLSX.writeFile(workbook, `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    }, [filteredProducts]);

    return (
        <div className={styles.page}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />

            <div className={styles.inner}>
                <header className={styles.header}>
                    <div className={styles.titleBlock}>
                        <h1 className={styles.title}>คลังสินค้า</h1>
                        <p className={styles.subtitle}>จัดการและติดตามสินค้าทั้งหมดในระบบ</p>
                    </div>
                    <div className={styles.headerActions}>
                        <button onClick={exportToExcel} className={styles.exportBtn} disabled={!filteredProducts.length}>
                            <FileSpreadsheet size={15} /><span>Export Excel</span>
                        </button>
                        <Link to="/inventory/create" className={styles.newBtn}>
                            <Plus size={15} /><span>เพิ่มสินค้าใหม่</span>
                        </Link>
                    </div>
                </header>

                <div className={styles.summaryStrip}>
                    <div className={styles.summaryItem}>
                        <Package size={15} />
                        <span>สินค้าทั้งหมด</span>
                        <strong>{totalProducts.toLocaleString()} รายการ</strong>
                    </div>
                    <div className={styles.stripDivider} />
                    <div className={styles.summaryItem}>
                        <Tag size={15} />
                        <span>กำลังแสดง</span>
                        <strong className={styles.blueText}>{filteredProducts.length.toLocaleString()} รายการ</strong>
                    </div>
                    <div className={styles.stripDivider} />
                    <div className={styles.summaryItem}>
                        <span>ใกล้หมด</span>
                        <strong className={lowStock > 0 ? styles.amberText : styles.mutedText}>{lowStock} รายการ</strong>
                    </div>
                    <div className={styles.stripDivider} />
                    <div className={styles.summaryItem}>
                        <span>หมดสต็อก</span>
                        <strong className={outOfStock > 0 ? styles.roseText : styles.mutedText}>{outOfStock} รายการ</strong>
                    </div>
                </div>

                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อสินค้า..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className={styles.clearBtn} onClick={() => setSearchTerm('')}>✕</button>
                        )}
                    </div>
                    <div className={styles.selectWrap}>
                        <Filter size={13} className={styles.filterIcon} />
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={styles.select}>
                            <option value="all">ทุกหมวดหมู่</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className={styles.selectWrap}>
                        <Filter size={13} className={styles.filterIcon} />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.select}>
                            <option value="all">ทุกสถานะ</option>
                            <option value="normal">ปกติ</option>
                            <option value="low">ใกล้หมด</option>
                            <option value="out_of_stock">หมดสต็อก</option>
                            <option value="untracked">ไม่ติดตามสต็อก</option>
                        </select>
                    </div>
                    <button className={styles.refreshBtn} onClick={fetchProducts} title="รีเฟรช">
                        <RefreshCw size={15} className={loading ? styles.spin : ''} />
                    </button>
                </div>

                <div className={styles.tableCard}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.loadingDots}><span /><span /><span /></div>
                            <p>กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>
                                        <button className={styles.sortBtn} onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                                            สินค้า <ArrowUpDown size={12} />
                                        </button>
                                    </th>
                                    <th>หมวดหมู่</th>
                                    <th className={styles.textRight}>ราคา</th>
                                    <th className={styles.textRight}>จำนวน</th>
                                    <th>สถานะ</th>
                                    <th>อัปเดตเมื่อ</th>
                                    <th className={styles.textCenter}>ลบ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length > 0 ? filteredProducts.map((p, i) => (
                                    <tr
                                        key={p.products_id}
                                        className={styles.tableRow}
                                        style={{ animationDelay: `${i * 20}ms` }}
                                        onClick={() => navigate(`/inventory/products/${p.products_id}`)}
                                    >
                                        <td>
                                            <div className={styles.productCell}>
                                                <div className={styles.productImageWrap}>
                                                    <ProductImage imageUrl={p.image_url} productName={p.products_name} size="small" />
                                                </div>
                                                <span className={styles.productName}>{p.products_name}</span>
                                            </div>
                                        </td>
                                        <td><span className={styles.categoryBadge}>{p.category_name || '--'}</span></td>
                                        <td className={`${styles.textRight} ${styles.priceCell}`}>{formatCurrency(p.products_price)}</td>
                                        <td className={`${styles.textRight} ${styles.stockQty}`}>
                                            {p.track_stock ? p.products_stock.toLocaleString() : '--'}
                                        </td>
                                        <td>
                                            {p.track_stock
                                                ? <StockBadge stock={p.products_stock} minStock={p.min_stock_level ?? 10} trackStock={p.track_stock} />
                                                : <span className={styles.untrackedLabel}>--</span>
                                            }
                                        </td>
                                        <td className={styles.dateCell}>{formatDateTime(p.updated_at)}</td>
                                        <td className={styles.textCenter}>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={e => handleDelete(p.products_id, p.products_name, e)}
                                                disabled={deleting === p.products_id}
                                                title="ลบสินค้า"
                                            >
                                                {deleting === p.products_id
                                                    ? <div className={styles.deletingDot} />
                                                    : <Trash2 size={15} />
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className={styles.emptyRow}>
                                            ไม่พบสินค้าที่ตรงกับเงื่อนไขที่เลือก
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {confirmToast && (
                <ConfirmToast
                    productName={confirmToast.name}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setConfirmToast(null)}
                />
            )}
        </div>
    );
}

export default ProductTable;