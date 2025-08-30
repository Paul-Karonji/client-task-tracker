// backend/config/database.js
const mysql = require('mysql2/promise');

// Load .env only in local dev; Render injects env vars directly
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// TiDB Serverless requires TLS
const useTLS = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const ssl =
  useTLS
    ? (process.env.DB_CA_CERT
        // If you add the PEM contents of the CA cert to DB_CA_CERT, we'll use it.
        ? { minVersion: 'TLSv1.2', rejectUnauthorized: true, ca: process.env.DB_CA_CERT }
        // Otherwise rely on system CAs (often fine on Render).
        : { minVersion: 'TLSv1.2', rejectUnauthorized: true })
    : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,

  // mysql2 valid timeout option (avoid warnings about acquireTimeout/timeout)
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 60000),

  ssl,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ Database connection OK');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  }
}

module.exports = { pool, testConnection };
