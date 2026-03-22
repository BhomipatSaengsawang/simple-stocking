const pool = require('../db/db_pool');

// =================================================================
// GET ALL  →  GET /categories
// (requires auth middleware on the route)
// =================================================================
exports.getAllCat = async (req, res) => {
    try {
        const { rows } = await pool.query(
            // ✅ Only return THIS user's categories
            'SELECT * FROM categories WHERE user_id = $1 ORDER BY category_id ASC',
            [req.user.user_id]
        );

        return res.status(200).json({
            success : true,
            count   : rows.length,
            data    : rows,
        });

    } catch (error) {
        console.error('[getAllCat] DB Error:', error);
        return res.status(500).json({
            success : false,
            error   : 'Failed to fetch categories',
        });
    }
};

// =================================================================
// GET BY ID  →  GET /categories/:id
// =================================================================
exports.getCatByid = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query(
            // ✅ Must belong to this user
            'SELECT * FROM categories WHERE category_id = $1 AND user_id = $2',
            [id, req.user.user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success : false,
                error   : 'Category not found',
            });
        }

        return res.status(200).json({
            success : true,
            data    : rows[0],
        });

    } catch (error) {
        console.error('[getCatByid] DB Error:', error);
        return res.status(500).json({
            success : false,
            error   : 'Failed to fetch category',
        });
    }
};

// =================================================================
// CREATE  →  POST /categories
// =================================================================
exports.addCategory = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({
            success : false,
            error   : 'Category name is required',
        });
    }

    try {
        const { rows } = await pool.query(
            // ✅ Save user_id when creating
            'INSERT INTO categories (category_name, user_id) VALUES ($1, $2) RETURNING *',
            [name, req.user.user_id]
        );

        return res.status(201).json({
            success : true,
            message : 'Category created successfully',
            data    : rows[0],
        });

    } catch (error) {
        console.error('[addCategory] DB Error:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                success : false,
                error   : 'Category name already exists',
            });
        }

        return res.status(500).json({
            success : false,
            error   : 'Failed to create category',
        });
    }
};

// =================================================================
// UPDATE  →  PUT /categories/:id
// =================================================================
exports.modCategory = async (req, res) => {
    const { id }   = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({
            success : false,
            error   : 'Category name is required',
        });
    }

    try {
        const { rows } = await pool.query(
            // ✅ AND user_id ensures user can only edit their own
            `UPDATE categories
             SET category_name = $1
             WHERE category_id = $2 AND user_id = $3
             RETURNING *`,
            [name, id, req.user.user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success : false,
                error   : 'Category not found',
            });
        }

        return res.status(200).json({
            success : true,
            message : 'Category updated successfully',
            data    : rows[0],
        });

    } catch (error) {
        console.error('[modCategory] DB Error:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                success : false,
                error   : 'Category name already exists',
            });
        }

        return res.status(500).json({
            success : false,
            error   : 'Failed to modify category',
        });
    }
};

// =================================================================
// DELETE  →  DELETE /categories/:id
// =================================================================
exports.delCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query(
            // ✅ AND user_id ensures user can only delete their own
            'DELETE FROM categories WHERE category_id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success : false,
                error   : 'Category not found',
            });
        }

        return res.status(200).json({
            success : true,
            message : 'Category deleted successfully',
            data    : rows[0],
        });

    } catch (error) {
        console.error('[delCategory] DB Error:', error);
        return res.status(500).json({
            success : false,
            error   : 'Failed to delete category',
        });
    }
};