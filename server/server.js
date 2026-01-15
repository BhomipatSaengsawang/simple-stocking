require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const cors = require('cors');
const corsOption = {
    origin: ["http://localhost:5173"],
};
app.use(cors(corsOption));


const productsRoutes = require('./routes/products');
app.use('/products', productsRoutes)

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to my project'
    })
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running OK',
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Enviroment: ${process.env.NODE_ENV}`);
});

