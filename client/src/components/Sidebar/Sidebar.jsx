import React                        from 'react';
import { NavLink, useNavigate }     from 'react-router-dom';
import { jwtDecode }                from 'jwt-decode'; // ✅ เพิ่ม
import { 
    Package, 
    ShoppingBag,
    LogOut,
    ChevronLeft,
    ChevronRight,
    UserCircle                       // ✅ เพิ่ม Icon User
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const navigate = useNavigate();

    // ===== ดึงข้อมูล User จาก Token =====
    const getUserFromToken = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

            const decoded = jwtDecode(token);
            return decoded; // { user_id, username, email, role }
        } catch (err) {
            return null;
        }
    };

    const user = getUserFromToken();

    // ===== Menu Items =====
    const menuItems = [
        { path: '/inventory', name: 'คลังสินค้า', icon: <Package size={20} />     },
        { path: '/sale',      name: 'ขายสินค้า',  icon: <ShoppingBag size={20} /> },
        { path: '/dashboard', name: 'ภาพรวม',     icon: null                      }
    ];

    // ===== Logout =====
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>

            {/* ===== Header: Logo + Toggle ===== */}
            <div className={styles.header}>
                {!isCollapsed && <div className={styles.logoArea}>Bhomi</div>}
                <button 
                    className={styles.toggleBtn} 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed 
                        ? <ChevronRight size={18} /> 
                        : <ChevronLeft  size={18} />
                    }
                </button>
            </div>

            {/* ===== User Profile ===== */}
            <div className={styles.userProfile}>
                <UserCircle size={isCollapsed ? 28 : 40} className={styles.userAvatar} />
                {!isCollapsed && (
                    <div className={styles.userInfo}>
                        {/* ดึง username และ email จาก Token */}
                        <p className={styles.userName}>
                            {user?.username || 'ไม่ทราบชื่อ'}
                        </p>
                        <p className={styles.userEmail}>
                            {user?.email || ''}
                        </p>
                        <span className={styles.userRole}>
                            {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                    </div>
                )}
            </div>

            {/* ===== Nav Links ===== */}
            <nav className={styles.navLinks}>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {menuItems.map((item) => (
                        <li key={item.path} className={styles.navItem}>
                            <NavLink 
                                to={item.path} 
                                className={({ isActive }) => 
                                    isActive 
                                        ? `${styles.link} ${styles.activeLink}` 
                                        : styles.link
                                }
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                {!isCollapsed && <span>{item.name}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* ===== Footer: Logout ===== */}
            <div className={styles.footer}>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={20} />
                    {!isCollapsed && <span>ออกจากระบบ</span>}
                </button>
            </div>

        </aside>
    );
};

export default Sidebar;
