import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // เพิ่มบรรทัดนี้
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    DollarSign, ShoppingCart, AlertTriangle, TrendingUp, RefreshCw, Calendar, Banknote
} from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const navigate = useNavigate(); // เพิ่มบรรทัดนี้
    // ... state อื่นๆ ที่มีอยู่เดิม
    // 1. State สำหรับเก็บข้อมูลสถิติ (เพิ่ม today และ month)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,   // เพิ่มใหม่
        monthRevenue: 0,   // เพิ่มใหม่
        totalOrders: 0,
        lowStockItems: 0,
        topProducts: []
    });

    const [dateFilter, setDateFilter] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 3. ฟังก์ชันดึงข้อมูลจาก API
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('http://localhost:8080/api/dashboard/stats', {
                params: {
                    startDate: dateFilter.startDate,
                    endDate: dateFilter.endDate
                }
            });

            if (response.data && response.data.success) {
                const d = response.data.data;
                setStats({
                    totalRevenue: d.totalRevenue || 0,
                    todayRevenue: d.todayRevenue || 0, // รับค่าจาก Backend
                    monthRevenue: d.monthRevenue || 0, // รับค่าจาก Backend
                    totalOrders: d.totalOrders || 0,
                    lowStockItems: d.lowStockItems || 0,
                    topProducts: d.topProducts || []
                });
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError("ไม่สามารถดึงข้อมูลได้ โปรดตรวจสอบการเชื่อมต่อ Backend หรือช่วงวันที่");
        } finally {
            setLoading(false);
        }
    }, [dateFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateFilter(prev => ({ ...prev, [name]: value }));
    };

    if (loading && stats.topProducts.length === 0) return <div className={styles.statusCenter}>กำลังโหลดข้อมูล...</div>;

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1>แผงควบคุมระบบ (Dashboard)</h1>
                    <p>สรุปผลข้อมูลร้านค้าของคุณ</p>
                </div>

                <div className={styles.filterCard}>
                    <div className={styles.dateInputGroup}>
                        <Calendar size={18} className={styles.icon} />
                        <div className={styles.inputItem}>
                            <label>ตั้งแต่วันที่</label>
                            <input
                                type="date"
                                name="startDate"
                                value={dateFilter.startDate}
                                onChange={handleDateChange}
                            />
                        </div>
                        <div className={styles.inputItem}>
                            <label>ถึงวันที่</label>
                            <input
                                type="date"
                                name="endDate"
                                value={dateFilter.endDate}
                                onChange={handleDateChange}
                            />
                        </div>
                        <button onClick={fetchData} className={styles.refreshBtn} title="รีเฟรชข้อมูล">
                            <RefreshCw size={18} className={loading ? styles.spin : ''} />
                            <span>กรองข้อมูล</span>
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className={styles.errorBanner}>
                    <AlertTriangle size={20} /> {error}
                </div>
            )}

            {/* Summary Cards - เพิ่มยอดรายวันและรายเดือน */}
            <div className={styles.statsGrid}>
                {/* 🟢 รายได้วันนี้ */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.green}`}>
                        <TrendingUp />
                    </div>
                    <div className={styles.statInfo}>
                        <span>รายได้วันนี้</span>
                        <h3>฿{stats.todayRevenue.toLocaleString()}</h3>
                    </div>
                </div>

                {/* 🔵 รายได้เดือนนี้ */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.blue}`}>
                        <Banknote />
                    </div>
                    <div className={styles.statInfo}>
                        <span>รายได้เดือนนี้</span>
                        <h3>฿{stats.monthRevenue.toLocaleString()}</h3>
                    </div>
                </div>

                {/* 🟣 รายได้ตามตัวกรองที่เลือก */}
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.purple}`}>
                        <DollarSign />
                    </div>
                    <div className={styles.statInfo}>
                        <span>รายได้ตามช่วงที่เลือก</span>
                        <h3>฿{stats.totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>

                {/* 🟠 ออเดอร์และสต็อก */}
                <div
                    className={`${styles.statCard} ${styles.clickableCard}`} // เพิ่ม style สำหรับบอกว่าคลิกได้
                    onClick={() => navigate('/dashboard/order', {
                        state: {
                            startDate: dateFilter.startDate,
                            endDate: dateFilter.endDate
                        }
                    })}
                    style={{ cursor: 'pointer' }} // เพิ่ม cursor เพื่อให้ผู้ใช้รู้ว่ากดได้
                >
                    <div className={`${styles.iconCircle} ${styles.orange}`}>
                        <ShoppingCart />
                    </div>
                    <div className={styles.statInfo}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>คำสั่งซื้อ</span>
                            {/* คุณอาจเพิ่มไอคอนชี้ไปข้างหน้าเล็กๆ เพื่อความสวยงาม */}
                        </div>
                        <h3>{stats.totalOrders.toLocaleString()} รายการ</h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.iconCircle} ${styles.red}`}>
                        <AlertTriangle />
                    </div>
                    <div className={styles.statInfo}>
                        <span>สินค้าสต็อกต่ำ</span>
                        <h3 className={stats.lowStockItems > 0 ? styles.alertText : ''}>
                            {stats.lowStockItems} รายการ
                        </h3>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className={styles.chartSection}>
                <div className={styles.chartHeader}>
                    <TrendingUp size={20} />
                    <h3>สินค้าขายดี 5 อันดับแรก (ตามช่วงวันที่เลือก)</h3>
                </div>
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={stats.topProducts}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tick={{ fill: '#64748b' }} />
                            <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                                {stats.topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#94a3b8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
