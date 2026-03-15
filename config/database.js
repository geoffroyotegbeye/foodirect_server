const mysql = require('mysql2/promise');

// Railway injecte DATABASE_URL, sinon on utilise les variables séparées
const poolConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'foodirect',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

const pool = mysql.createPool(poolConfig);

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
