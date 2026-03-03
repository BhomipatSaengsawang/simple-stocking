const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. ระบุ Path ให้ชัดเจนและรองรับสภาพแวดล้อมที่ต่างกัน
const baseUploadDir = path.join(__dirname, '../uploads');
const productUploadDir = path.join(baseUploadDir, 'products');

// สร้าง Folder อัตโนมัติ (ตรวจสอบทั้งโฟลเดอร์หลักและโฟลเดอร์ย่อย)
if (!fs.existsSync(productUploadDir)) {
    fs.mkdirSync(productUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, productUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        
        // 2. ปรับปรุง: ล้างชื่อไฟล์ (Sanitize) ให้เหลือแค่ A-Z, 0-9 และขีด เพื่อป้องกัน Error ใน URL
        const originalNameSafe = path.basename(file.originalname, ext)
            .replace(/[^a-z0-9]/gi, '_') // เปลี่ยนตัวอักษรที่ไม่ใช่ภาษาอังกฤษ/ตัวเลข เป็น _
            .toLowerCase();

        cb(null, `${originalNameSafe}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // 3. ปรับปรุง: เพิ่มความเข้มงวดในการตรวจเช็คไฟล์ (Case Sensitive)
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        // ส่ง Error Object พร้อมข้อความที่ชัดเจน
        const error = new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

module.exports = upload;