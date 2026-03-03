const pool = require('../db/db_pool');

// =================================================================
// CONSTANTS
// =================================================================
const ALLOWED_PAYMENT_METHODS = ['cash', 'credit_card', 'qr_code'];

// =================================================================
// HELPERS
// =================================================================

const validateItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 'No items in cart';
    }
    for (const item of items) {
        const { product_id, quantity, unit_price } = item;
        if (!product_id)                  return 'product_id is required for all items';
        if (!quantity || quantity <= 0)   return `Invalid quantity for product ID ${product_id}`;
        if (!unit_price || unit_price < 0) return `Invalid unit_price for product ID ${product_id}`;
    }
    return null;
};

// =================================================================
// CREATE SALE (CHECKOUT)  →  POST /sales
// =================================================================

exports.createSale = async (req, res) => {
    const { payment_method, items } = req.body;

    const itemError = validateItems(items);
    if (itemError) {
        return res.status(400).json({ success: false, error: itemError });
    }

    if (!payment_method || !ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
        return res.status(400).json({
            success : false,
            error   : `payment_method must be one of: ${ALLOWED_PAYMENT_METHODS.join(', ')}`,
        });
    }

    const total_amount = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price, 0
    );

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. INSERT หัวบิล
        const { rows: saleRows } = await client.query(
            `INSERT INTO sales (total_amount, payment_method)
             VALUES ($1, $2)
             RETURNING *`,
            [total_amount, payment_method]
        );
        const saleId = saleRows[0].sale_id;

        // 2. วนลูปแต่ละ item
        for (const item of items) {
            const { product_id, quantity, unit_price } = item;
            const subtotal = quantity * unit_price;

            // 2.1 ✅ ดึงข้อมูลสินค้าพร้อม track_stock และ Lock แถว
            const { rows: stockRows } = await client.query(
                `SELECT products_name, products_stock, track_stock
                 FROM   products
                 WHERE  products_id = $1
                 FOR UPDATE`, 
                [product_id]
            );

            if (stockRows.length === 0) {
                throw { status: 404, message: `Product ID ${product_id} not found` };
            }

            const product = stockRows[0];

            // 2.2 ✅ ตรวจสอบและตัดสต็อก (เฉพาะเมื่อ track_stock เป็น TRUE)
            if (product.track_stock === true) {
                // ตรวจสอบสต็อก
                if (product.products_stock < quantity) {
                    throw {
                        status  : 400,
                        message : `"${product.products_name}" has insufficient stock `
                                + `(available: ${product.products_stock}, requested: ${quantity})`,
                    };
                }

                // ตัดสต็อก
                await client.query(
                    `UPDATE products
                     SET    products_stock = products_stock - $1
                     WHERE  products_id    = $2`,
                    [quantity, product_id]
                );
            } 
            // 💡 ถ้า track_stock เป็น FALSE ระบบจะข้ามการเช็คและการตัดสต็อกไปเลย

            // 2.3 INSERT รายการสินค้า (บันทึกประวัติการขายเสมอ ไม่ว่าจะตัดสต็อกหรือไม่)
            await client.query(
                `INSERT INTO sale_items (sale_id, products_id, quantity, unit_price, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [saleId, product_id, quantity, unit_price, subtotal]
            );
        }

        await client.query('COMMIT');

        return res.status(201).json({
            success      : true,
            message      : 'Sale completed successfully',
            sale_id      : saleId,
            total_amount,
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[createSale] Transaction Error:', error);

        const status  = error.status  || 500;
        const message = error.message || 'Internal Server Error';

        return res.status(status).json({ success: false, error: message });

    } finally {
        client.release();
    }
};

// =================================================================
// GET SALE HISTORY / GET BY ID (คงเดิม)
// =================================================================

exports.getSalesHistory = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        let queryParams = [];
        let queryStr = `
            SELECT 
                sale_id AS id, 
                sale_id AS "orderNumber", 
                total_amount AS "totalAmount", 
                payment_method AS "paymentMethod", 
                sale_date AS "createdAt",
                'completed' AS status -- กำหนดสถานะตั้งต้นเป็นสำเร็จ
            FROM sales 
            WHERE 1=1
        `;

        // กรองตามวันที่
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            queryStr += ` AND sale_date::date BETWEEN $1 AND $2`;
        }

        // ค้นหาตามเลขที่บิล (sale_id)
        if (search) {
            queryParams.push(`%${search}%`);
            const searchIdx = queryParams.length;
            queryStr += ` AND CAST(sale_id AS TEXT) LIKE $${searchIdx}`;
        }

        queryStr += ` ORDER BY sale_date DESC`;

        const { rows } = await pool.query(queryStr, queryParams);

        return res.status(200).json({ 
            success: true, 
            count: rows.length, 
            data: rows.map(item => ({
                ...item,
                totalAmount: parseFloat(item.totalAmount) // แปลงเป็นตัวเลขเพื่อความถูกต้อง
            }))
        });
    } catch (error) {
        console.error('[getSalesHistory] DB Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

exports.getSaleById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            `SELECT s.sale_id, s.total_amount, s.payment_method, s.sale_date,
                    p.products_name, si.quantity, si.unit_price, si.subtotal
             FROM sales s
             JOIN sale_items si ON s.sale_id = si.sale_id
             JOIN products p ON si.products_id = p.products_id
             WHERE s.sale_id = $1`,
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Sale not found' });

        const saleData = {
            sale_id: rows[0].sale_id,
            sale_date: rows[0].sale_date,
            total_amount: rows[0].total_amount,
            payment_method: rows[0].payment_method,
            items: rows.map(r => ({
                product_name: r.products_name,
                quantity: r.quantity,
                unit_price: r.unit_price,
                subtotal: r.subtotal,
            })),
        };
        return res.status(200).json({ success: true, data: saleData });
    } catch (error) {
        console.error('[getSaleById] DB Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
