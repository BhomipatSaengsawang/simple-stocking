const pool = require('../db/db_pool');

exports.getAll = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY products_id ASC');
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
};