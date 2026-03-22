const pool = require('../db/db_pool');

// =================================================================
// GET DASHBOARD STATS  →  GET /dashboard
// =================================================================
exports.getDashboardStats = async (req, res) => {
    try {
        const startDate = req.query.startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
        const endDate   = req.query.endDate   || new Date().toISOString().split('T')[0];

        const userId = req.user.user_id; // ✅ get from JWT

        // 1. รายได้และจำนวนบิลตามช่วงวันที่เลือก
        const salesRes = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_revenue, 
                COUNT(*) as total_orders 
            FROM sales 
            WHERE user_id = $1
              AND sale_date::date BETWEEN $2 AND $3
        `, [userId, startDate, endDate]); // ✅ added user_id

        // 2. รายได้เฉพาะ "วันนี้"
        const todayRes = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM sales 
            WHERE user_id = $1
              AND sale_date::date = CURRENT_DATE
        `, [userId]); // ✅ added user_id

        // 3. รายได้เฉพาะ "เดือนนี้"
        const monthRes = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM sales 
            WHERE user_id = $1
              AND DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)
        `, [userId]); // ✅ added user_id

        // 4. สินค้าขายดี 5 อันดับตามช่วงวันที่เลือก
        const topProductsRes = await pool.query(`
            SELECT 
                p.products_name AS name, 
                SUM(si.quantity)::int AS sales
            FROM sale_items si
            JOIN sales s    ON si.sale_id     = s.sale_id
            JOIN products p ON si.products_id = p.products_id
            WHERE s.user_id = $1
              AND s.sale_date::date BETWEEN $2 AND $3
            GROUP BY p.products_name
            ORDER BY sales DESC 
            LIMIT 5
        `, [userId, startDate, endDate]); // ✅ added user_id

        // 5. สินค้าสต็อกต่ำ (เฉพาะสินค้าของ user นี้)
        const stockRes = await pool.query(`
            SELECT COUNT(*) as low_stock_count 
            FROM products 
            WHERE user_id = $1
              AND track_stock = TRUE
              AND products_stock > 0
              AND products_stock <= min_stock_level
        `, [userId]); // ✅ added user_id

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue  : parseFloat(salesRes.rows[0].total_revenue),
                todayRevenue  : parseFloat(todayRes.rows[0].revenue),
                monthRevenue  : parseFloat(monthRes.rows[0].revenue),
                totalOrders   : parseInt(salesRes.rows[0].total_orders),
                lowStockItems : parseInt(stockRes.rows[0].low_stock_count),
                topProducts   : topProductsRes.rows
            }
        });

    } catch (err) {
        console.error('[Dashboard Error]:', err);
        res.status(500).json({
            success  : false,
            message  : 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ',
            error    : err.message
        });
    }
};

// =================================================================
// GET ALL ORDERS  →  GET /orders
// =================================================================
exports.getAllOrders = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        const userId = req.user.user_id; // ✅ get from JWT

        // ✅ user_id is always $1
        let queryParams = [userId];
        let sql = `
            SELECT 
                s.sale_id as id,
                s.sale_id as "orderNumber", 
                s.sale_date as "createdAt",
                COALESCE(s.customer_name, 'ลูกค้าทั่วไป') as "customerName",
                s.total_amount as "totalAmount",
                'completed' as status
            FROM sales s
            WHERE s.user_id = $1
        `; // ✅ always filter by user first

        // 1. Filter วันที่
        if (startDate && endDate) {
            queryParams.push(startDate); // $2
            queryParams.push(endDate);   // $3
            sql += ` AND s.sale_date::date BETWEEN $2 AND $3`;
        }

        // 2. Search
        if (search) {
            queryParams.push(`%${search}%`);
            const searchIdx = queryParams.length; // $2 or $4
            sql += ` AND (CAST(s.sale_id AS TEXT) LIKE $${searchIdx} OR s.customer_name ILIKE $${searchIdx})`;
        }

        // 3. เรียงลำดับ
        sql += ` ORDER BY s.sale_date DESC`;

        const result = await pool.query(sql, queryParams);

        return res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                id          : row.id,
                orderNumber : row.orderNumber,
                createdAt   : row.createdAt,
                customerName: row.customerName,
                totalAmount : parseFloat(row.totalAmount) || 0,
                status      : row.status
            }))
        });

    } catch (err) {
        console.error('[Order List Error]:', err);
        res.status(500).json({
            success : false,
            message : 'เกิดข้อผิดพลาดในการดึงรายการคำสั่งซื้อ',
            error   : err.message
        });
    }
};