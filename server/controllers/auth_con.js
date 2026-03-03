const pool = require('../db/db_pool');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// =================================================================
// CONSTANTS
// =================================================================
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRE = '1d'; // Token หมดอายุใน 1 วัน

// ตรวจสอบรูปแบบ Email ว่าถูกต้องหรือไม่ (Regex)
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

// =================================================================
// REGISTER  →  POST /register
// =================================================================

exports.register = async (req, res) => {
    const { username, email, password, full_name } = req.body;

    // 1. Validation เบื้องต้น
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Username, Email, and Password are required' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    try {
        // 2. Hash รหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. บันทึกลงฐานข้อมูล
        const { rows } = await pool.query(
            `INSERT INTO users (username, email, password_hash, full_name)
             VALUES ($1, $2, $3, $4) 
             RETURNING user_id, username, email, full_name`,
            [username, email.toLowerCase(), hashedPassword, full_name]
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: rows[0]
        });

    } catch (error) {
        console.error('[Register] Error:', error);
        
        // จัดการกรณี Email หรือ Username ซ้ำ (PostgreSQL Error Code 23505)
        if (error.code === '23505') {
            const field = error.detail.includes('email') ? 'Email' : 'Username';
            return res.status(409).json({ success: false, error: `${field} already exists` });
        }

        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// =================================================================
// LOGIN  →  POST /login
// =================================================================

exports.login = async (req, res) => {
    // ปรับให้รองรับการ Login ด้วย Email หรือ Username ก็ได้
    const { identifier, password } = req.body; // identifier คือค่าที่รับมาจากหน้าเว็บ (Email หรือ Username)

    if (!identifier || !password) {
        return res.status(400).json({ success: false, error: 'Please provide credentials' });
    }

    try {
        // ค้นหาผู้ใช้ (ตรวจสอบทั้ง Username และ Email)
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1', 
            [identifier.toLowerCase()]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = rows[0];

        // ตรวจสอบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // สร้าง JWT Token (ใส่ Email ลงใน Payload ด้วย)
        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                full_name: user.full_name
            }
        });

    } catch (error) {
        console.error('[Login] Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};