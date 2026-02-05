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
    const { name, price, stock } = req.body;

    // Validation
    if(!name || !price) {
        return res.status(409).json({
            success: false,
            error: 'name and price are required'
        });
    }

    // Validation stack
    const productStock = stock !== undefined ? parseInt(stock) : 0;

    if(productStock < 0) {
        return res.status(400).json({
            success: false,
            error: 'Stock cannot be nagative'
        });
    }

    try {
        const result = await pool.query(
            'INSERT INTO products (products_name, products_price, products_stock) VALUES ($1, $2, $3) RETURNING *',
            [name, price, productStock]
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

    // // "PUT" update product
    exports.upProduct = async (req, res) => {
        const { id } = req.params;
        const { name, price, stock } = req.body;

        // Validation
        if(!name && !price && stock === undefined) {
            return res.status(400).json({
                success: false,
                error: 'At least one field (name, price, or stock) is required'
            });
        }

        // Validation stock if provided
        if(stock !== undefined && stock < 0) {
            return res.status(400).json({
                success: false,
                error: 'Stock cannot be negative'
            });
        }

        try {
            let updateFields = [];
            let values = [];
            let paramCount = 1;

            if(name) {
                updateFields.push(`products_name = $${paramCount}`);
                values.push(name);
                paramCount++;
            }

            if(price) {
                updateFields.push(`products_price = $${paramCount}`);
                values.push(price);
                paramCount++;
            }

            if(stock !== undefined) {
                updateFields.push(`products_stock = $${paramCount}`);
                values.push(stock);
                paramCount++;
            }

            values.push(id); // เพิ่ม id เป็น parameter สุดท้าย

            const query = `
                UPDATE products SET ${updateFields.join(', ')}
                WHERE products_id = $${paramCount} RETURNING *`;
            
            const result = await pool.query(query, values);

            if(result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating product:', error);

            if(error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: 'Product name already exists'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Failed to update product'
            });
        }

    };

// PATCH product
exports.patchProduct = async (req, res) => {
    const { id } = req.params;
    const upProduct = req.body;

    try {
        const field = [];
        const values = [];
        let paramCount = 1;

        if(upProduct.name !== undefined) {
            field.push(`products_name = $${paramCount}`);
            values.push(upProduct.name)
            paramCount++;
        }

        if(upProduct.price !== undefined) {
            field.push(`products_price = $${paramCount}`);
            values.push(upProduct.price);
            paramCount++;
        }

        if(upProduct.stock !== undefined) {
            field.push(`products_stock = $${paramCount}`);
            values.push(upProduct.stock);
            paramCount++;
        }

        if(field.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        values.push(id);

        const query = `
            UPDATE products SET ${field.join(', ')}
            WHERE products_id = $${paramCount}
            RETURNING *`;
        
        console.log('Query:', query);
        console.log('Values', values);

        const result = await pool.query(query, values);

        if(result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Prodcut not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            updateFields: Object.keys(upProduct),
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating product:', error);
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