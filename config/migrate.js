const { pool } = require('./database');

// Vérifie si une colonne existe dans une table
const columnExists = async (table, column) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].count > 0;
};

// Vérifie si une table existe
const tableExists = async (table) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows[0].count > 0;
};

const migrate = async () => {
  console.log('🔄 Vérification des migrations...');

  try {

    // ─── TABLE users ───────────────────────────────────────────────
    if (!await tableExists('users')) {
      await pool.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          role ENUM('admin','editor','viewer','staff','customer') DEFAULT 'customer',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table users créée');

      // Admin par défaut (mot de passe: admin123)
      await pool.query(`
        INSERT INTO users (name, email, password, phone, role)
        VALUES ('Admin FOODIRECT', 'admin@foodirect.com', '$2a$10$ZJWtu3.elGXstpvwcstAJeJf69b3mFAz/Ea3lteHkN6fYsDFL3yHO', '+22901160557623', 'admin')
        ON DUPLICATE KEY UPDATE name=name
      `);
      console.log('  ✅ Admin par défaut inséré');
    }

    // ─── TABLE menu ────────────────────────────────────────────────
    if (!await tableExists('menu')) {
      await pool.query(`
        CREATE TABLE menu (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          image VARCHAR(255) DEFAULT '/assets/1.png',
          category ENUM('plat','boisson','dessert','extra') DEFAULT 'plat',
          available BOOLEAN DEFAULT TRUE,
          rating DECIMAL(2,1) DEFAULT 5.0,
          note TEXT,
          featured BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table menu créée');
    } else {
      // Colonnes optionnelles ajoutées après la création initiale
      if (!await columnExists('menu', 'rating')) {
        await pool.query(`ALTER TABLE menu ADD COLUMN rating DECIMAL(2,1) DEFAULT 5.0`);
        console.log('  ✅ Colonne menu.rating ajoutée');
      }
      if (!await columnExists('menu', 'note')) {
        await pool.query(`ALTER TABLE menu ADD COLUMN note TEXT`);
        console.log('  ✅ Colonne menu.note ajoutée');
      }
      if (!await columnExists('menu', 'featured')) {
        await pool.query(`ALTER TABLE menu ADD COLUMN featured BOOLEAN DEFAULT FALSE`);
        console.log('  ✅ Colonne menu.featured ajoutée');
      }
    }

    // ─── TABLE accompaniments ──────────────────────────────────────
    if (!await tableExists('accompaniments')) {
      await pool.query(`
        CREATE TABLE accompaniments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) DEFAULT 0,
          image VARCHAR(255),
          available BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table accompaniments créée');
    }

    // ─── TABLE menu_accompaniments ─────────────────────────────────
    if (!await tableExists('menu_accompaniments')) {
      await pool.query(`
        CREATE TABLE menu_accompaniments (
          menu_id INT NOT NULL,
          accompaniment_id INT NOT NULL,
          PRIMARY KEY (menu_id, accompaniment_id),
          FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE,
          FOREIGN KEY (accompaniment_id) REFERENCES accompaniments(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table menu_accompaniments créée');
    }

    // ─── TABLE orders ──────────────────────────────────────────────
    if (!await tableExists('orders')) {
      await pool.query(`
        CREATE TABLE orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(20) NOT NULL,
          customer_address TEXT NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          status ENUM('en_attente','confirmee','en_preparation','en_livraison','livree','annulee') DEFAULT 'en_attente',
          payment_method ENUM('especes','mobile_money','carte') DEFAULT 'especes',
          payment_status ENUM('en_attente','payee','echouee') DEFAULT 'en_attente',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table orders créée');
    }

    // ─── TABLE order_items ─────────────────────────────────────────
    if (!await tableExists('order_items')) {
      await pool.query(`
        CREATE TABLE order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          menu_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (menu_id) REFERENCES menu(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table order_items créée');
    }

    // ─── TABLE settings ────────────────────────────────────────────
    if (!await tableExists('settings')) {
      await pool.query(`
        CREATE TABLE settings (
          \`key\` VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table settings créée');
    }

    // Valeurs par défaut des settings
    await pool.query(`
      INSERT INTO settings (\`key\`, value) VALUES
        ('hero_image',     '/assets/1.png'),
        ('delivery_image', '/assets/3.png'),
        ('about_image',    '/assets/2.png')
      ON DUPLICATE KEY UPDATE \`key\` = \`key\`
    `);

    console.log('✅ Migrations terminées');

  } catch (error) {
    console.error('❌ Erreur de migration:', error.message);
    throw error;
  }
};

module.exports = { migrate };
