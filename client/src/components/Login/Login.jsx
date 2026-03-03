import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../Login/Login.module.css';

const API_BASE = 'http://localhost:8080/api';

function LoginPage() {
    const navigate = useNavigate();

    // --- States ---
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Submit Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!identifier || !password) {
            setError('กรุณากรอก Username/Email และ Password');
            return;
        }

        try {
            setLoading(true);

            const res = await axios.post(`${API_BASE}/user/login`, {
                identifier, // ✅ เปลี่ยนจาก email เป็น identifier
                password,
            });

            localStorage.setItem('token', res.data.token);
            navigate('/inventory');

        } catch (err) {
            console.error('[LoginPage] handleSubmit:', err);
            setError(err.response?.data?.error || 'Login ไม่สำเร็จ กรุณาลองใหม่');
            //                       ↑ เปลี่ยนจาก .message เป็น .error ให้ตรงกับ Backend
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <h2>เข้าสู่ระบบ</h2>
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

                    <div className={styles.formGroup}>
                        <label htmlFor="identifier">Username หรือ Email</label>
                        <input
                            id="identifier"
                            type="text"           
                            placeholder="Username หรือ Email"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className={styles.input}
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.btnSubmit}
                        disabled={loading}
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>

                </form>

                {/* Register Link */}
                <p className={styles.registerLink}>
                    ยังไม่มีบัญชี?{' '}
                    <span onClick={() => navigate('/register')}>
                        สมัครสมาชิก
                    </span>
                </p>

            </div>
        </div>
    );
}

export default LoginPage;
