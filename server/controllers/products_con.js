const pool = require('../db/db_pool');

// "GET" all products
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

// "GET" product by id
exports.getByid = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
        'SELECT * FROM products WHERE products_id = $1', [id]        
        );

        if(result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ 
        success: false,
        error: 'Failed to fetch product' 
        });
    }
};

// "POST" new product
exports.addProduct = async (req, res) => {
    const { name, price } = req.body;

    // Validation
    if(!name || !price) {
        return res.status(409).json({
            success: false,
            error: 'name and price are required'
        });
    }

    try {
        const result = await pool.query(
            'INSERT INTO products (products_name, products_price) VALUES ($1, $2) RETURNING *',
            [name, price]
        );

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating product:', error);

        // Handle duplicate product violation
        if(error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Product already exists'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create product'
        });
    }
};

// "PUT" update product
exports.upProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;

    if(!name || !price) {
        return res.status(400).json({
            success: false,
            error: 'name and price are required'
        });
    }

    try {
        const result = await pool.query(
            'UPDATE products SET products_name = $1, products_price = $2, updated_at = NOW() WHERE products_id = $3 RETURNING *',
            [name, price, id]
        );

        if(result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Product not found' 
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating product:', error);

        if (error.code === '23505') {
            return res.status(409).json({ 
                success: false,
                error: 'Product already exists' 
            });
        }

        res.status(500).json({ 
            success: false,
            error: 'Failed to update product' 
        });
    }
};

// "DELETE" product
exports.delProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM products WHERE products_id = $1 RETURNING *',
            [id]
        );

        if(result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Product not found' 
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete product' 
        });
    }
};