const mysql = require('mysql2/promise');

const baseOptions = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 30000,
};

let poolConfig;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  poolConfig = {
    ...baseOptions,
    host:     url.hostname,
    port:     parseInt(url.port) || 3306,
    user:     url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    ssl:      { rejectUnauthorized: false },
  };
} else {
  poolConfig = {
    ...baseOptions,
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'foodirect',
  };
}

const pool = mysql.createPool(poolConfig);

// Garder le pool vivant — évite ETIMEDOUT sur Railway
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    console.warn('⚠️  Keep-alive ping échoué:', e.message);
  }
}, 30000);

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connecté à MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };
