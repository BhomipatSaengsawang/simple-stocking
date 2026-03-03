const pool = require('../db/db_pool');

// =================================================================
// GET ALL  →  GET /categories
// =================================================================

exports.getAllCat = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM categories ORDER BY category_id ASC'
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
            'SELECT * FROM categories WHERE category_id = $1',
            [id]
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

    // --- Validation ---
    if (!name) {
        return res.status(400).json({
            success : false,
            error   : 'Category name is required',    
        });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO categories (category_name) VALUES ($1) RETURNING *',
            [name]
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

    // --- Validation ---
    if (!name) {
        return res.status(400).json({
            success : false,
            error   : 'Category name is required',    
        });
    }

    try {
        /*
         * หมายเหตุ: เนื่องจาก category มีฟิลด์เดียวที่แก้ได้คือ category_name
         * จึงไม่จำเป็นต้องใช้ Dynamic Query แบบซับซ้อน
         * แต่คงโครงสร้างเดิมไว้เพื่อรองรับการขยายในอนาคต
         */
        const updateFields = [];
        const values       = [];
        let   paramCount   = 1;

        if (name) {
            updateFields.push(`category_name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }

        values.push(id);

        const sql = `
            UPDATE categories
            SET ${updateFields.join(', ')}
            WHERE category_id = $${paramCount}
            RETURNING *
        `;

        const { rows } = await pool.query(sql, values);

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
            'DELETE FROM categories WHERE category_id = $1 RETURNING *',
            [id]
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
