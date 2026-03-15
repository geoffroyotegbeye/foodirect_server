const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('✅ Connecté à MySQL');

  // Table accompaniments
  await connection.query(`
    CREATE TABLE IF NOT EXISTS accompaniments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      image VARCHAR(255) DEFAULT '/assets/default.png',
      available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table accompaniments créée');

  // Table de liaison menu <-> accompaniments
  await connection.query(`
    CREATE TABLE IF NOT EXISTS menu_accompaniments (
      menu_id INT NOT NULL,
      accompaniment_id INT NOT NULL,
      PRIMARY KEY (menu_id, accompaniment_id),
      FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE,
      FOREIGN KEY (accompaniment_id) REFERENCES accompaniments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table menu_accompaniments créée');

  await connection.end();
  console.log('✅ Migration terminée');
}

migrate().catch(console.error);
