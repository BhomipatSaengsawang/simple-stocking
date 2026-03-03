import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash, FaPlus, FaSearch, FaFilter, FaFileExcel, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import styles from './Table.module.css';
import StockBadge from '../StockBadge/StockBadge';
import ProductImage from '../ProductImage/ProductImage';

const API_BASE = 'http://localhost:8080/api';

// ================= HELPERS =================
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

function ProductTable() {
    const navigate = useNavigate();
    const [allProducts, setAllProducts] = useState([]);
    const [deleting, setDeleting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // State สำหรับกรองสถานะ
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/products`);
            setAllProducts(res.data.data ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleDelete = useCallback(async (id, productName, event) => {
        event.stopPropagation();
        if (!window.confirm(`ต้องการลบ "${productName}" ใช่หรือไม่?`)) return;
        try {
            setDeleting(id);
            await axios.delete(`${API_BASE}/products/${id}`);
            setAllProducts((prev) => prev.filter((p) => p.products_id !== id));
        } finally { setDeleting(null); }
    }, []);

    const categories = useMemo(() =>
        [...new Set(allProducts.map((p) => p.category_name).filter(Boolean))].sort(),
        [allProducts]
    );

    // Logic การกรองข้อมูล (รวมทั้ง Search, Category และ Status)
    const filteredProducts = useMemo(() => {
        return allProducts.filter((p) => {
            const status = getStockStatus(p.products_stock, p.min_stock_level ?? 10, p.track_stock);
            const matchSearch = p.products_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = filterCategory === 'all' || p.category_name === filterCategory;
            const matchStatus = filterStatus === 'all' || status === filterStatus;
            return matchSearch && matchCategory && matchStatus;
        });
    }, [allProducts, filterStatus, filterCategory, searchTerm]);

    const exportToExcel = useCallback(() => {
        const dataToExport = filteredProducts.map(p => ({
            "รหัสสินค้า": p.products_id,
            "ชื่อสินค้า": p.products_name,
            "หมวดหมู่": p.category_name || 'ไม่มีหมวดหมู่',
            "ราคา": p.products_price,
            "จำนวน": p.track_stock ? p.products_stock : '∞',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        XLSX.writeFile(workbook, `Stock_Report.xlsx`);
    }, [filteredProducts]);

    if (loading) return <div className={styles.loadingState}>กำลังโหลด...</div>;

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
                {/* จัดทุกอย่างให้อยู่ในแถวเดียวกัน */}
                <div className={styles.headerLayout}>
                    <h2>คลังสินค้า</h2>

                    <div className={styles.filterGroup}>
                        <div className={styles.searchWrapper}>
                            <FaSearch className={styles.searchIcon} />
                            <input
                                type="text" placeholder="ค้นหาสินค้า..."
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        <div className={styles.selectWrapper}>
                            <FaFilter className={styles.filterIcon} />
                            <select className={styles.dropdown} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                                <option value="all">ทุกหมวดหมู่</option>
                                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className={styles.selectWrapper}>
                            <FaFilter className={styles.filterIcon} />
                            <select className={styles.dropdown} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">ทุกสถานะ</option>
                                <option value="normal">ปกติ</option>
                                <option value="low">ใกล้หมด</option>
                                <option value="out_of_stock">หมดสต็อก</option>
                                <option value="untracked">ไม่ติดตามสต็อก</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.actionButtons}>
                        <button onClick={exportToExcel} className={styles.btnExport}><FaFileExcel /> Export</button>
                        <Link to="/inventory/create" className={styles.btnNew}><FaPlus /> เพิ่มสินค้าใหม่</Link>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.customTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>รูป</th>
                            <th>ชื่อสินค้า</th>
                            <th>หมวดหมู่</th>
                            <th className={styles.textRight}>ราคา</th>
                            <th className={styles.textRight}>จำนวน</th>
                            <th>สถานะ</th>
                            <th>อัปเดตเมื่อ</th>
                            <th className={styles.textCenter}>ลบ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((p) => (
                            <tr key={p.products_id} onClick={() => navigate(`/inventory/products/${p.products_id}`)} className={styles.clickableRow}>
                                <td><ProductImage imageUrl={p.image_url} productName={p.products_name} size="small" /></td>
                                <td className={styles.nameCell}><strong>{p.products_name}</strong></td>
                                <td><span className={styles.categoryBadge}>{p.category_name || '--'}</span></td>
                                <td className={styles.textRight}>{formatCurrency(p.products_price)}</td>
                                <td className={styles.textRight}>{p.track_stock ? p.products_stock.toLocaleString() : '--'}</td>
                                <td>
                                    {p.track_stock ? (
                                        <StockBadge stock={p.products_stock} minStock={p.min_stock_level ?? 10} trackStock={p.track_stock} />
                                    ) : (<span>--</span>)}
                                </td>
                                <td className={styles.dateCell}>{formatDateTime(p.updated_at)}</td>
                                <td className={styles.textCenter}>
                                    <button
                                        onClick={(e) => handleDelete(p.products_id, p.products_name, e)}
                                        disabled={deleting === p.products_id}
                                        className={styles.btnDelete}
                                    ><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default ProductTable;
