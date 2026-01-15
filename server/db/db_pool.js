require('dotenv').config();
const { Pool } = require('pg');

// Create pgSQL connection pool 
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Pool configuration
    max: 20,                        // Maximum number of clients in pool
    min: 5,                         // Minimum number of clients in pool
    idleTimeoutMillis: 30000,       // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000,  // Return error after 2 seconds if connection fails
    maxUses: 7500,                  // Close connection after 7500 uses
});

module.exports = pool;