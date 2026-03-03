const pool = require('../db/db_pool');

exports.getDashboardStats = async (req, res) => {
    try {
        const startDate = req.query.startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
        const endDate = req.query.endDate || new Date().toISOString().split('T')[0];

        // 1. รายได้และจำนวนบิลตามช่วงวันที่เลือก (จาก Filter)
        const salesRes = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_revenue, 
                COUNT(*) as total_orders 
            FROM sales 
            WHERE sale_date::date BETWEEN $1 AND $2
        `, [startDate, endDate]);

        // --- เพิ่มใหม่ 2 รายการ ---
        // 2. รายได้เฉพาะ "วันนี้"
        const todayRes = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM sales 
            WHERE sale_date::date = CURRENT_DATE
        `);

        // 3. รายได้เฉพาะ "เดือนนี้" (ตั้งแต่ต้นเดือนจนถึงวันนี้)
        const monthRes = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM sales 
            WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)
        `);
        // -------------------------

        // 4. สินค้าขายดี 5 อันดับตามช่วงวันที่เลือก
        const topProductsRes = await pool.query(`
            SELECT 
                p.products_name AS name, 
                SUM(si.quantity)::int AS sales
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.sale_id
            JOIN products p ON si.products_id = p.products_id
            WHERE s.sale_date::date BETWEEN $1 AND $2
            GROUP BY p.products_name
            ORDER BY sales DESC 
            LIMIT 5
        `, [startDate, endDate]);

        // 5. สินค้าสต็อกต่ำ (สถานะปัจจุบัน)
        const stockRes = await pool.query(`
            SELECT COUNT(*) as low_stock_count FROM products 
            WHERE products_stock <= min_stock_level
        `);

        // ส่งข้อมูลกลับไปยัง React พร้อมฟิลด์ใหม่
        return res.status(200).json({
            success: true,
            data: {
                totalRevenue: parseFloat(salesRes.rows[0].total_revenue), // ตามช่วงวันที่
                todayRevenue: parseFloat(todayRes.rows[0].revenue),       // เพิ่มใหม่: รายได้วันนี้
                monthRevenue: parseFloat(monthRes.rows[0].revenue),       // เพิ่มใหม่: รายได้เดือนนี้
                totalOrders: parseInt(salesRes.rows[0].total_orders),
                lowStockItems: parseInt(stockRes.rows[0].low_stock_count),
                topProducts: topProductsRes.rows
            }
        });

    } catch (err) {
        console.error('[Dashboard Error]:', err);
        res.status(500).json({ 
            success: false, 
            message: "เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ",
            error: err.message 
        });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        let queryParams = [];
        let queryHeader = `
            SELECT 
                s.sale_id as id,
                s.sale_id as "orderNumber", 
                s.sale_date as "createdAt",
                COALESCE(s.customer_name, 'ลูกค้าทั่วไป') as "customerName",
                s.total_amount as "totalAmount",
                'completed' as status
            FROM sales s
            WHERE 1=1
        `;

        // 1. จัดการ Filter วันที่ (แก้ไข Parameter Sequence ให้ถูกต้อง)
        if (startDate && endDate) {
            queryParams.push(startDate); // $1
            queryParams.push(endDate);   // $2
            queryHeader += ` AND s.sale_date::date BETWEEN $1 AND $2`;
        }

        // 2. จัดการ Search (ต่อยอดจากพารามิเตอร์ที่มีอยู่)
        if (search) {
            queryParams.push(`%${search}%`); // จะเป็น $1 หรือ $3 ขึ้นอยู่กับเงื่อนไขแรก
            const searchIdx = queryParams.length;
            queryHeader += ` AND (CAST(s.sale_id AS TEXT) LIKE $${searchIdx} OR s.customer_name ILIKE $${searchIdx})`;
        }

        // 3. เรียงลำดับ
        queryHeader += ` ORDER BY s.sale_date DESC`;

        const result = await pool.query(queryHeader, queryParams);

        // 4. ส่งข้อมูลกลับ (ตรวจสอบให้แน่ใจว่าตัวเลขเป็น Number และ Success เป็น true)
        return res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                id: row.id,
                orderNumber: row.orderNumber,
                createdAt: row.createdAt,
                customerName: row.customerName,
                totalAmount: parseFloat(row.totalAmount) || 0,
                status: row.status
            }))
        });

    } catch (err) {
        console.error('[Order List Error]:', err);
        res.status(500).json({ 
            success: false, 
            message: "เกิดข้อผิดพลาดในการดึงรายการคำสั่งซื้อ",
            error: err.message 
        });
    }
};