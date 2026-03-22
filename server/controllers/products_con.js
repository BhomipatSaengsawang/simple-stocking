const pool = require('../db/db_pool');
const { deleteFile } = require('../utils/fileHelper');

// =================================================================
// HELPERS
// =================================================================

// ✅ Added userId param to WHERE clause for security
const buildUpdateQuery = (id, userId, fields) => {
    const keys = Object.keys(fields).filter(
        (key) => fields[key] !== undefined
    );

    if (keys.length === 0) {
        throw new Error('No fields to update');
    }

    const setClause = keys
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ');

    // ✅ id = $N, userId = $N+1
    const values = [...keys.map((key) => fields[key]), id, userId];

    const query = `
        UPDATE products
        SET    ${setClause}, updated_at = NOW()
        WHERE  products_id = $${keys.length + 1}
          AND  user_id     = $${keys.length + 2}
        RETURNING *
    `;

    return { query, values };
};

const parseNumber = (value, type = 'float') => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return type === 'int' ? parseInt(value, 10) : parseFloat(value);
};

// =================================================================
// GET ALL / GET BY ID
// =================================================================
exports.getProducts = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.user_id; // ✅

    try {
        let whereClause, values;

        if (id) {
            // ✅ Must belong to this user
            whereClause = 'WHERE p.products_id = $1 AND p.user_id = $2';
            values = [id, userId];
        } else {
            // ✅ Only this user's products
            whereClause = 'WHERE p.user_id = $1';
            values = [userId];
        }

        const sql = `
            SELECT
                p.*,
                c.category_name,
                CASE
                    WHEN p.track_stock = FALSE                 THEN 'normal'
                    WHEN p.products_stock <= 0                 THEN 'out_of_stock'
                    WHEN p.products_stock <= p.min_stock_level THEN 'low'
                    ELSE                                            'normal'
                END AS stock_status
            FROM  products p
            LEFT  JOIN categories c ON p.category_id = c.category_id
            ${whereClause}
            ORDER BY p.created_at DESC
        `;

        const { rows } = await pool.query(sql, values);

        if (id && rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: id ? rows[0] : rows,
        });

    } catch (error) {
        console.error('[getProducts] Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// =================================================================
// CREATE
// =================================================================
exports.createProduct = async (req, res) => {
    const {
        name, des, price, cost,
        stock, category_id,
        min_stock_lev, max_stock_lev,
        available, track_stock
    } = req.body;

    const userId = req.user.user_id; // ✅

    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Product name is required' });
    if (price === undefined || price === null || price === '') return res.status(400).json({ success: false, error: 'Price is required' });

    try {
        const imgPath = req.file ? `/uploads/products/${req.file.filename}` : null;
        const imgName = req.file ? req.file.filename : null;

        const sql = `
            INSERT INTO products (
                user_id,
                products_name,   products_des,
                products_price,  products_cost,
                products_stock,  category_id,
                min_stock_level, max_stock_level,
                image_url,       image_filename,
                is_available,    track_stock
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `; // ✅ user_id is $1, rest shift by 1

        const values = [
            userId, // ✅ $1
            name.trim(),
            des || null,
            parseFloat(price),
            parseFloat(cost || 0),
            parseInt(stock || 0, 10),
            category_id ? parseInt(category_id, 10) : null,
            parseInt(min_stock_lev || 10, 10),
            parseInt(max_stock_lev || 100, 10),
            imgPath,
            imgName,
            available !== undefined ? (available === 'true' || available == true) : true,
            track_stock !== undefined ? (track_stock === 'true' || track_stock == true) : true
        ];

        const { rows } = await pool.query(sql, values);
        return res.status(201).json({ success: true, data: rows[0] });

    } catch (error) {
        if (req.file) await deleteFile(req.file.filename);
        if (error.code === '23505') return res.status(409).json({ success: false, error: 'Product name already exists' });
        console.error('[createProduct] DB Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// =================================================================
// UPDATE
// =================================================================
exports.updateProduct = async (req, res) => {
    const { id }   = req.params;
    const userId   = req.user.user_id; // ✅

    try {
        // ✅ Check ownership before updating
        const { rows: existing } = await pool.query(
            'SELECT image_filename FROM products WHERE products_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existing.length === 0) return res.status(404).json({ success: false, error: 'Product not found' });

        const fields = {
            products_name   : req.body.name?.trim() || undefined,
            products_des    : req.body.des !== undefined ? (req.body.des || null) : undefined,
            products_price  : parseNumber(req.body.price, 'float'),
            products_cost   : parseNumber(req.body.cost, 'float'),
            products_stock  : parseNumber(req.body.stock, 'int'),
            category_id     : req.body.category_id !== undefined
                                ? (req.body.category_id ? parseInt(req.body.category_id, 10) : null)
                                : undefined,
            min_stock_level : parseNumber(req.body.min_stock_lev, 'int'),
            max_stock_level : parseNumber(req.body.max_stock_lev, 'int'),
            is_available    : req.body.available !== undefined
                                ? (req.body.available === 'true' || req.body.available == true)
                                : undefined,
            track_stock     : req.body.track_stock !== undefined
                                ? (req.body.track_stock === 'true' || req.body.track_stock == true)
                                : undefined,
        };

        if (req.file) {
            if (existing[0].image_filename) await deleteFile(existing[0].image_filename);
            fields.image_url      = `/uploads/products/${req.file.filename}`;
            fields.image_filename = req.file.filename;
        }

        // ✅ Pass userId to buildUpdateQuery
        const { query, values } = buildUpdateQuery(id, userId, fields);
        const { rows } = await pool.query(query, values);

        return res.status(200).json({ success: true, data: rows[0] });

    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ success: false, error: 'Product name already exists' });
        console.error('[updateProduct] Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// =================================================================
// DELETE
// =================================================================
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.user_id; // ✅
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ✅ AND user_id ensures only owner can delete
        const { rows } = await client.query(
            'DELETE FROM products WHERE products_id = $1 AND user_id = $2 RETURNING image_filename',
            [id, userId]
        );

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        await client.query('COMMIT');

        if (rows[0].image_filename) {
            await deleteFile(rows[0].image_filename);
        }

        return res.status(200).json({ success: true, message: 'ลบสินค้าเรียบร้อยแล้ว' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[deleteProduct] DB Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// =================================================================
// DELETE IMAGE ONLY
// =================================================================
exports.deleteImage = async (req, res) => {
    const { id }   = req.params;
    const userId   = req.user.user_id; // ✅

    try {
        // ✅ AND user_id ensures only owner can delete image
        const { rows } = await pool.query(
            'SELECT image_filename FROM products WHERE products_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const { image_filename } = rows[0];
        if (image_filename) {
            await deleteFile(image_filename);
        }

        await pool.query(
            `UPDATE products
             SET    image_url      = NULL,
                    image_filename = NULL,
                    updated_at     = NOW()
             WHERE  products_id = $1 AND user_id = $2`,
            [id, userId] // ✅
        );

        return res.status(200).json({ success: true, message: 'Image deleted successfully' });

    } catch (error) {
        console.error('[deleteImage] DB Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to delete image' });
    }
};