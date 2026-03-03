require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: false,
}));

const corsOption = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["http://localhost:5173"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
};
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const saleRoutes = require('./routes/sale');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/user');

app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/user', usersRoutes);

// Access server successfully
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to my project'
    })
});

// Server health check 
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running OK',
        timestamp: new Date().toISOString()
    });
});

// 404 Not Found Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error 
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(`[Error] ${err.stack}`);
    
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Something went wrong!',
        // แสดง Stack เฉพาะตอนพัฒนา (Development)
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 7. Server Start & Graceful Shutdown
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🛠 Mode: ${process.env.NODE_ENV || 'development'}`);
});

// ปิดการเชื่อมต่ออย่างสะอาดเมื่อ Server หยุดทำงาน
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Process terminated');
    });
});
