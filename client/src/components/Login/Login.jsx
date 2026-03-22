import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function LoginPage() {
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!identifier || !password) {
            setError('กรุณากรอก Username/Email และ Password');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE}/user/login`, { identifier, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/inventory');
        } catch (err) {
            console.error('[LoginPage] handleSubmit:', err);
            setError(err.response?.data?.error || 'Login ไม่สำเร็จ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            {/* Ambient blobs */}
            <div className={styles.blob1} />
            <div className={styles.blob2} />
            <div className={styles.blob3} />

            {/* Grid overlay */}
            <div className={styles.grid} />

            <div className={styles.card}>
                {/* Brand */}
                <div className={styles.brand}>
                    <img src="/easy pos.png" alt="EasyPOS" className={styles.brandLogoImg} />
                    <div className={styles.brandText}>
                        <span className={styles.brandName}>EasyPOS</span>
                        <span className={styles.brandSub}>ระบบจัดการคลังสินค้า</span>
                    </div>
                </div>

                {/* Divider */}
                <div className={styles.divider} />

                {/* Header */}
                <div className={styles.cardHeader}>
                    <div className={styles.titleBadge}>
                        <span className={styles.badgeDot} />
                        <span>Secure Login</span>
                    </div>
                    <h2 className={styles.title}>เข้าสู่ระบบ</h2>
                    <p className={styles.subtitle}>ยินดีต้อนรับกลับ กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
                </div>

                {/* Error */}
                {error && (
                    <div className={styles.errorBox}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="identifier">Username หรือ Email</label>
                        <div className={styles.inputWrap}>
                            <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                id="identifier"
                                type="text"
                                placeholder="กรอก Username หรือ Email"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                className={styles.input}
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <div className={styles.inputWrap}>
                            <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <input
                                id="password"
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={styles.input}
                                disabled={loading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPass(p => !p)}
                                tabIndex={-1}
                            >
                                {showPass ? (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className={styles.btnSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <span className={styles.spinner} />
                                กำลังเข้าสู่ระบบ...
                            </>
                        ) : (
                            <>
                                เข้าสู่ระบบ
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                {/* Register */}
                <p className={styles.registerLink}>
                    ยังไม่มีบัญชี?{' '}
                    <span onClick={() => navigate('/register')}>สมัครสมาชิก</span>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;