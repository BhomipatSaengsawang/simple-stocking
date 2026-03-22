import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import {
    DollarSign, ShoppingCart, AlertTriangle, TrendingUp,
    RefreshCw, Calendar, Banknote, ArrowUpRight, Package,
    ChevronRight, Zap
} from 'lucide-react';
import styles from './Dashboard.module.css';

// ✅ Use env variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ✅ Helper to get auth header
const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        totalOrders: 0,
        lowStockItems: 0,
        topProducts: []
    });
    const [dateFilter, setDateFilter] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [animKey, setAnimKey] = useState(0);

    const fetchData = useCallback(async () => {
        // ✅ Check token before fetching
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_BASE}/dashboard/stats`, {
                params: { startDate: dateFilter.startDate, endDate: dateFilter.endDate },
                ...getAuthHeader() // ✅ Send token
            });

            if (response.data && response.data.success) {
                const d = response.data.data;
                setStats({
                    totalRevenue : d.totalRevenue  || 0,
                    todayRevenue : d.todayRevenue  || 0,
                    monthRevenue : d.monthRevenue  || 0,
                    totalOrders  : d.totalOrders   || 0,
                    lowStockItems: d.lowStockItems || 0,
                    topProducts  : d.topProducts   || []
                });
                setAnimKey(k => k + 1);
            }
        } catch (err) {
            console.error('Fetch error:', err);

            // ✅ Handle expired/invalid token
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }

            setError('ไม่สามารถดึงข้อมูลได้ โปรดตรวจสอบการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    }, [dateFilter, navigate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateFilter(prev => ({ ...prev, [name]: value }));
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>{label}</p>
                    <p className={styles.tooltipValue}>฿{Number(payload[0].value).toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    const statCards = [
        {
            key: 'today',
            label: 'รายได้วันนี้',
            value: `฿${stats.todayRevenue.toLocaleString()}`,
            icon: <TrendingUp size={20} />,
            accent: 'emerald',
            delay: 0,
        },
        {
            key: 'month',
            label: 'รายได้เดือนนี้',
            value: `฿${stats.monthRevenue.toLocaleString()}`,
            icon: <Banknote size={20} />,
            accent: 'sky',
            delay: 80,
        },
        {
            key: 'range',
            label: 'รายได้ตามช่วงที่เลือก',
            value: `฿${stats.totalRevenue.toLocaleString()}`,
            icon: <DollarSign size={20} />,
            clickable: false,
            accent: 'violet',
            delay: 160,
        },
        {
            key: 'orders',
            label: 'คำสั่งซื้อทั้งหมด',
            value: `${stats.totalOrders.toLocaleString()} รายการ`,
            icon: <ShoppingCart size={20} />,
            accent: 'amber',
            delay: 240,
        },
        {
            key: 'stock',
            label: 'สินค้าสต็อกต่ำ',
            value: `${stats.lowStockItems} รายการ`,
            icon: <Package size={20} />,
            accent: stats.lowStockItems > 0 ? 'rose' : 'slate',
            clickable: false,
            delay: 320,
            alert: stats.lowStockItems > 0,
        },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />

            <div className={styles.inner}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.titleBlock}>
                        <h1 className={styles.title}>รายงานภาพรวม</h1>
                        <p className={styles.subtitle}>สรุปผลข้อมูลร้านค้าของคุณแบบเรียลไทม์</p>
                    </div>

                    <div className={styles.filterCard}>
                        <div className={styles.filterRow}>
                            <div className={styles.filterLabel}>
                                <Calendar size={14} />
                                <span>ช่วงเวลา</span>
                            </div>
                            <div className={styles.dateInputs}>
                                <div className={styles.dateField}>
                                    <label>ตั้งแต่</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={dateFilter.startDate}
                                        onChange={handleDateChange}
                                    />
                                </div>
                                <div className={styles.dateSeparator}>—</div>
                                <div className={styles.dateField}>
                                    <label>ถึงวันที่</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={dateFilter.endDate}
                                        onChange={handleDateChange}
                                    />
                                </div>
                            </div>
                            <button onClick={fetchData} className={styles.applyBtn} disabled={loading}>
                                <RefreshCw size={15} className={loading ? styles.spin : ''} />
                                <span>กรองข้อมูล</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Error */}
                {error && (
                    <div className={styles.errorBar}>
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Stat Cards */}
                <div className={styles.statsGrid} key={animKey}>
                    {statCards.map((card) => (
                        <div
                            key={card.key}
                            className={`${styles.statCard} ${styles[`accent_${card.accent}`]} ${card.clickable ? styles.clickable : ''} ${card.alert ? styles.alertCard : ''}`}
                            onClick={card.clickable ? card.onClick : undefined}
                            style={{ animationDelay: `${card.delay}ms` }}
                        >
                            <div className={styles.cardTop}>
                                <div className={styles.cardIconWrap}>{card.icon}</div>
                                {card.clickable && <div className={styles.cardArrow}><ChevronRight size={16} /></div>}
                                {card.alert && (
                                    <div className={styles.alertPing}>
                                        <span className={styles.pingRing} />
                                        <span className={styles.pingDot} />
                                    </div>
                                )}
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>{card.label}</span>
                                <p className={styles.cardValue}>{card.value}</p>
                            </div>
                            {card.clickable && <div className={styles.cardShine} />}
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className={styles.chartsRow}>
                    <div className={styles.chartCard}>
                        <div className={styles.chartCardHeader}>
                            <div className={styles.chartTitleGroup}>
                                <TrendingUp size={18} className={styles.chartIcon} />
                                <div>
                                    <h3>สินค้าขายดี 5 อันดับ</h3>
                                    <p>ตามช่วงเวลาที่เลือก</p>
                                </div>
                            </div>
                            <div className={styles.chartBadge}>Top 5</div>
                        </div>
                        <div className={styles.chartBody}>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={stats.topProducts} barSize={36}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" fontSize={12} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={12} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                    <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                                        {stats.topProducts.map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? 'url(#barGrad0)' : i === 1 ? 'url(#barGrad1)' : 'url(#barGrad2)'} />
                                        ))}
                                    </Bar>
                                    <defs>
                                        <linearGradient id="barGrad0" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#2563eb" />
                                        </linearGradient>
                                        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#7c3aed" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.quickPanel}>
                        <div className={styles.quickHeader}>
                            <h3>รายงานด่วน</h3>
                            <p>ดูรายละเอียดเพิ่มเติม</p>
                        </div>
                        <div className={styles.quickLinks}>
                            {[
                                { label: 'รายการคำสั่งซื้อวันนี้', sub: 'ออเดอร์ล่าสุด',    path: '/dashboard/today', color: '#fbbf24' },
                                { label: 'สรุปยอดรายเดือน',        sub: 'ภาพรวมเดือนนี้',   path: '/dashboard/month', color: '#a78bfa' },
                                { label: 'รายการทั้งหมด',           sub: 'ตามช่วงที่กรอง',   path: '/dashboard/order', color: '#60a5fa' },
                            ].map((link) => (
                                <button key={link.path} className={styles.quickLink} onClick={() => navigate(link.path)}>
                                    <div className={styles.quickDot} style={{ background: link.color }} />
                                    <div className={styles.quickText}>
                                        <span>{link.label}</span>
                                        <small>{link.sub}</small>
                                    </div>
                                    <ArrowUpRight size={16} className={styles.quickArrow} />
                                </button>
                            ))}
                        </div>

                        {stats.lowStockItems > 0 && (
                            <div className={styles.alertBox}>
                                <AlertTriangle size={16} />
                                <div>
                                    <strong>สต็อกต่ำ!</strong>
                                    <p>มี {stats.lowStockItems} รายการที่ต้องเติมสต็อก</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;