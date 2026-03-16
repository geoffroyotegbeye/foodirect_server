const mysql = require('mysql2/promise');

// Railway injecte DATABASE_URL, sinon on utilise les variables séparées
const baseOptions = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 30000,
};

const poolConfig = process.env.DATABASE_URL
  ? {
      ...baseOptions,
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      ...baseOptions,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'foodirect',
    };

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
