const pool = require('../db/db_pool');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// =================================================================
// CONSTANTS
// =================================================================
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRE = '1d';

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

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Username, Email, and Password are required' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    try {
        // ✅ Use SALT_ROUNDS constant
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

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
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ success: false, error: 'Please provide credentials' });
    }

    try {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [identifier.toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // ✅ Use JWT_SECRET and TOKEN_EXPIRE constants (removed hardcoded fallback)
        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRE }
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

// =================================================================
// GET /api/user/promptpay
// =================================================================
exports.getPromptPay = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT promptpay_number FROM users WHERE user_id = $1',
            [req.user.user_id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
        return res.status(200).json({ success: true, promptpay_number: rows[0].promptpay_number });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// =================================================================
// PUT /api/user/promptpay
// =================================================================
exports.updatePromptPay = async (req, res) => {
    const { promptpay_number } = req.body;
    if (!promptpay_number) return res.status(400).json({ success: false, error: 'promptpay_number is required' });
    try {
        const { rows } = await pool.query(
            'UPDATE users SET promptpay_number = $1 WHERE user_id = $2 RETURNING promptpay_number',
            [promptpay_number, req.user.user_id]
        );
        return res.status(200).json({ success: true, promptpay_number: rows[0].promptpay_number });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};