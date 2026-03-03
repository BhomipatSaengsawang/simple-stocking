const fs = require('fs').promises;
const path = require('path');

exports.deleteFile = async (filename) => {
    if (!filename) return;
    const filepath = path.join(__dirname, '../uploads/products', filename);
    try {
        await fs.access(filepath); // เช็คว่ามีไฟล์ไหม
        await fs.unlink(filepath);
    } catch (err) {
        console.error(`File deletion failed: ${filename}`, err.message);
    }
};
