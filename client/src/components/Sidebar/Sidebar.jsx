import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
    Package, ShoppingBag, LayoutDashboard,
    LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const navigate = useNavigate();

    const getUserFromToken = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const decoded = jwtDecode(token);
            const now = Date.now() / 1000;
            if (decoded.exp && decoded.exp < now) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return null;
            }
            return decoded;
        } catch {
            return null;
        }
    };

    const user = getUserFromToken();

    const menuItems = [
        { path: '/dashboard', name: 'ภาพรวม', icon: <LayoutDashboard size={18} />, accent: 'emerald' },
        { path: '/inventory', name: 'คลังสินค้า', icon: <Package size={18} />, accent: 'green' },
        { path: '/sale', name: 'ขายสินค้า', icon: <ShoppingBag size={18} />, accent: 'amber' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : '??';

    // Generate a consistent hue from username
    const avatarHue = user?.username
        ? user.username.charCodeAt(0) * 137 % 360
        : 160;

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>

            {/* Header */}
            <div className={styles.header}>
                {!isCollapsed && (
                    <div className={styles.logo}>
                        <img
                            src="/easy pos.png"
                            alt="EasyPOS"
                            className={styles.logoImg}
                        />
                        <span className={styles.logoText}>EasyPOS</span>
                    </div>
                )}
                <button
                    className={styles.toggleBtn}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'ขยาย' : 'ยุบ'}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* User Profile */}
            {!isCollapsed ? (
                <div className={styles.userProfile}>
                    <div className={styles.avatarWrap}>
                        <div
                            className={styles.avatar}
                            style={{ background: `hsl(${avatarHue}, 60%, 45%)` }}
                        >
                            {initials}
                        </div>
                        <span className={styles.onlineDot} />
                    </div>
                    <div className={styles.userInfo}>
                        <p className={styles.userName}>{user?.username || 'ผู้ใช้'}</p>
                        <p className={styles.userEmail}>{user?.email || 'ไม่มีอีเมล'}</p>
                    </div>
                </div>
            ) : (
                <div className={styles.userProfileCollapsed}>
                    <div className={styles.avatarWrap}>
                        <div
                            className={styles.avatar}
                            style={{ background: `hsl(${avatarHue}, 60%, 45%)` }}
                            title={user?.username}
                        >
                            {initials}
                        </div>
                        <span className={styles.onlineDot} />
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className={styles.divider} style={{ marginTop: 12 }} />

            {/* Nav */}
            <nav className={styles.nav}>
                {!isCollapsed && <p className={styles.navLabel}>เมนูหลัก</p>}
                <ul>
                    {menuItems.map(item => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? `${styles.navLinkActive} ${styles[`accent_${item.accent}`]}` : ''}`
                                }
                                title={isCollapsed ? item.name : undefined}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                {!isCollapsed && <span className={styles.navText}>{item.name}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ flex: 1 }} />

            {/* Footer */}
            <div className={styles.footer}>
                <div className={styles.divider} style={{ marginBottom: 12 }} />
                <button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                    title={isCollapsed ? 'ออกจากระบบ' : undefined}
                >
                    <LogOut size={16} />
                    {!isCollapsed && <span>ออกจากระบบ</span>}
                </button>
            </div>

        </aside>
    );
};

export default Sidebar;