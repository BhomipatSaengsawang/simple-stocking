import React, { useState } from 'react';
import { useNavigate }     from 'react-router-dom';
import axios               from 'axios';
import styles              from '../Register/Register.module.css';

const API_BASE = 'http://localhost:8080/api';

function RegisterPage() {
    const navigate = useNavigate();

    // --- States ---
    const [formData, setFormData] = useState({
        username       : '',
        email          : '',
        password       : '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const [success, setSuccess] = useState(false);

    // --- Handle Input Change ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // --- Validate ---
    const validate = () => {
        const { username, email, password, confirmPassword } = formData;

        if (!username || !email || !password || !confirmPassword) {
            return 'กรุณากรอกข้อมูลให้ครบทุกช่อง';
        }
        if (username.length < 3) {
            return 'Username ต้องมีอย่างน้อย 3 ตัวอักษร';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'รูปแบบ Email ไม่ถูกต้อง';
        }
        if (password.length < 6) {
            return 'Password ต้องมีอย่างน้อย 6 ตัวอักษร';
        }
        if (password !== confirmPassword) {
            return 'Password และ Confirm Password ไม่ตรงกัน';
        }
        return null; // ผ่านทุก Validate
    };

    // --- Submit Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validate ก่อนส่ง
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);

            await axios.post(`${API_BASE}/user/register`, {
                username: formData.username,
                email   : formData.email,
                password: formData.password,
            });

            setSuccess(true);

            // รอ 2 วินาที แล้วไปหน้า Login
            setTimeout(() => navigate('/login'), 2000);

        } catch (err) {
            console.error('[RegisterPage] handleSubmit:', err);
            setError(err.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    // --- Success State ---
    if (success) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.card}>
                    <div className={styles.successBox}>
                        <div className={styles.successIcon}>✓</div>
                        <h3>สมัครสมาชิกสำเร็จ!</h3>
                        <p>กำลังพาไปหน้า Login...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <h2>สมัครสมาชิก</h2>
                    <p>ระบบจัดการคลังสินค้า</p>
                </div>

                {/* Error */}
                {error && (
                    <div className={styles.errorBox}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>

                    {/* Username */}
                    <div className={styles.formGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="ชื่อผู้ใช้งาน"
                            value={formData.username}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={loading}
                        />
                    </div>

                    {/* Email */}
                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={loading}
                        />
                    </div>

                    {/* Password */}
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={loading}
                        />
                        <span className={styles.hint}>อย่างน้อย 6 ตัวอักษร</span>
                    </div>

                    {/* Confirm Password */}
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`${styles.input} ${
                                formData.confirmPassword &&
                                formData.password !== formData.confirmPassword
                                    ? styles.inputError
                                    : ''
                            }`}
                            disabled={loading}
                        />
                        {/* แสดง hint แบบ realtime */}
                        {formData.confirmPassword && (
                            <span className={
                                formData.password === formData.confirmPassword
                                    ? styles.hintSuccess
                                    : styles.hintError
                            }>
                                {formData.password === formData.confirmPassword
                                    ? '✓ Password ตรงกัน'
                                    : '✗ Password ไม่ตรงกัน'}
                            </span>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className={styles.btnSubmit}
                        disabled={loading}
                    >
                        {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                    </button>

                </form>

                {/* Login Link */}
                <p className={styles.loginLink}>
                    มีบัญชีอยู่แล้ว?{' '}
                    <span onClick={() => navigate('/login')}>
                        เข้าสู่ระบบ
                    </span>
                </p>

            </div>
        </div>
    );
}

export default RegisterPage;
