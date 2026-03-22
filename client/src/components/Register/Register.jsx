import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Register.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function RegisterPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const { username, email, password, confirmPassword } = formData;
        if (!username || !email || !password || !confirmPassword)
            return 'กรุณากรอกข้อมูลให้ครบทุกช่อง';
        if (username.length < 3)
            return 'Username ต้องมีอย่างน้อย 3 ตัวอักษร';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return 'รูปแบบ Email ไม่ถูกต้อง';
        if (password.length < 6)
            return 'Password ต้องมีอย่างน้อย 6 ตัวอักษร';
        if (password !== confirmPassword)
            return 'Password และ Confirm Password ไม่ตรงกัน';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const validationError = validate();
        if (validationError) { setError(validationError); return; }
        try {
            setLoading(true);
            await axios.post(`${API_BASE}/user/register`, {
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            console.error('[RegisterPage] handleSubmit:', err);
            setError(err.response?.data?.error || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    const passwordMatch = formData.confirmPassword &&
        formData.password === formData.confirmPassword;
    const passwordMismatch = formData.confirmPassword &&
        formData.password !== formData.confirmPassword;

    /* ── Success Screen ── */
    if (success) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.blob1} />
                <div className={styles.blob2} />
                <div className={styles.grid} />
                <div className={`${styles.card} ${styles.successCard}`}>
                    <div className={styles.successIconWrap}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <div className={styles.successRing} />
                    </div>
                    <h3 className={styles.successTitle}>สมัครสมาชิกสำเร็จ!</h3>
                    <p className={styles.successSub}>กำลังพาไปหน้าเข้าสู่ระบบ...</p>
                    <div className={styles.successBar}><div className={styles.successBarFill} /></div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />
            <div className={styles.blob3} />
            <div className={styles.grid} />

            <div className={styles.card}>
                {/* Brand */}
                <div className={styles.brand}>
                    <div className={styles.brand}>
                        <img src="/easy pos.png" alt="EasyPOS" className={styles.brandLogoImg} />
                        <div className={styles.brandText}>
                            <span className={styles.brandName}>EasyPOS</span>
                            <span className={styles.brandSub}>ระบบจัดการคลังสินค้า</span>
                        </div>
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Header */}
                <div className={styles.cardHeader}>
                    <div className={styles.titleBadge}>
                        <span className={styles.badgeDot} />
                        <span>New Account</span>
                    </div>
                    <h2 className={styles.title}>สมัครสมาชิก</h2>
                    <p className={styles.subtitle}>สร้างบัญชีใหม่เพื่อเริ่มใช้งานระบบ</p>
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

                    {/* Username */}
                    <div className={styles.formGroup}>
                        <label htmlFor="username">Username</label>
                        <div className={styles.inputWrap}>
                            <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                id="username" name="username" type="text"
                                placeholder="ชื่อผู้ใช้งาน (อย่างน้อย 3 ตัว)"
                                value={formData.username}
                                onChange={handleChange}
                                className={styles.input}
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <div className={styles.inputWrap}>
                            <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input
                                id="email" name="email" type="email"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={styles.input}
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <div className={styles.inputWrap}>
                            <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <input
                                id="password" name="password"
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className={styles.input}
                                disabled={loading}
                                autoComplete="new-password"
                            />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)} tabIndex={-1}>
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
                        <span className={styles.hint}>อย่างน้อย 6 ตัวอักษร</span>
                    </div>

                    {/* Confirm Password */}
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className={styles.inputWrap}>
                            <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <input
                                id="confirmPassword" name="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`${styles.input} ${passwordMismatch ? styles.inputError : ''} ${passwordMatch ? styles.inputSuccess : ''}`}
                                disabled={loading}
                                autoComplete="new-password"
                            />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>
                                {showConfirm ? (
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
                        {formData.confirmPassword && (
                            <span className={passwordMatch ? styles.hintSuccess : styles.hintError}>
                                {passwordMatch ? '✓ Password ตรงกัน' : '✗ Password ไม่ตรงกัน'}
                            </span>
                        )}
                    </div>

                    <button type="submit" className={styles.btnSubmit} disabled={loading}>
                        {loading ? (
                            <><span className={styles.spinner} />กำลังสมัครสมาชิก...</>
                        ) : (
                            <>
                                สมัครสมาชิก
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <p className={styles.loginLink}>
                    มีบัญชีอยู่แล้ว?{' '}
                    <span onClick={() => navigate('/login')}>เข้าสู่ระบบ</span>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;