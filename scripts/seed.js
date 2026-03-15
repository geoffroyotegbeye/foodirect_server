const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function seedDatabase() {
  let connection;

  try {
    console.log(`\n${colors.blue}🌱 Démarrage du seeding de la base de données...${colors.reset}\n`);

    // Créer la connexion
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log(`${colors.green}✓ Connecté à MySQL${colors.reset}`);

    // 1. Créer la base de données
    console.log(`\n${colors.yellow}📦 Création de la base de données...${colors.reset}`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'foodirect'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE ${process.env.DB_NAME || 'foodirect'}`);
    console.log(`${colors.green}✓ Base de données créée/sélectionnée${colors.reset}`);

    // 2. Créer les tables
    console.log(`\n${colors.yellow}📋 Création des tables...${colors.reset}`);
    
    // Table users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'staff', 'customer') DEFAULT 'customer',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log(`${colors.green}✓ Table users créée${colors.reset}`);

    // Table menu
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255) DEFAULT '/assets/default.png',
        category ENUM('plat', 'boisson', 'dessert', 'extra') DEFAULT 'plat',
        available BOOLEAN DEFAULT TRUE,
        rating DECIMAL(2, 1) DEFAULT 5.0,
        note TEXT,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log(`${colors.green}✓ Table menu créée${colors.reset}`);

    // Table orders
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree', 'annulee') DEFAULT 'en_attente',
        payment_method ENUM('especes', 'mobile_money', 'carte') DEFAULT 'especes',
        payment_status ENUM('en_attente', 'payee', 'echouee') DEFAULT 'en_attente',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log(`${colors.green}✓ Table orders créée${colors.reset}`);

    // Table order_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        menu_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_id) REFERENCES menu(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log(`${colors.green}✓ Table order_items créée${colors.reset}`);

    // 3. Insérer l'utilisateur admin
    console.log(`\n${colors.yellow}👤 Création de l'utilisateur admin...${colors.reset}`);
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT INTO users (name, email, password, phone, role) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=name
    `, ['Admin FOODIRECT', 'admin@foodirect.com', adminPassword, '+2290191260434', 'admin']);
    
    console.log(`${colors.green}✓ Admin créé${colors.reset}`);
    console.log(`  Email: admin@foodirect.com`);
    console.log(`  Mot de passe: admin123`);

    // 4. Insérer les plats du menu
    console.log(`\n${colors.yellow}🍽️  Insertion des plats du menu...${colors.reset}`);
    
    const menuItems = [
      ['Pack Banger', 'Riz + Hors d\'oeuvres chaud + lapin/poulet bicyclette + wassa wassa + 2 ailerons + Chawarma viande', 10000, '/assets/3.png', 'plat', true, null],
      ['Sauce Gbota Royal (tête de mouton)', 'Avec Akassa ou Piron', 5000, '/assets/4.png', 'plat', true, null],
      ['Sauce Assrokouin bien garnie', 'Avec telibo', 3000, '/assets/5.png', 'plat', false, null],
      ['Telibo avec sauce gombo', 'Avec telibo ou Akassa', 3000, '/assets/3.png', 'plat', false, null],
      ['Agbeli', 'Avec sauce gombo ou sauce mouton fromage', 3000, '/assets/4.png', 'plat', false, null],
      ['Sauce Mouton', 'Avec Telibo ou Akassa ou Agbeli', 3000, '/assets/5.png', 'plat', false, null],
      ['Sauce Gombo Fretri gboman', 'Avec Agbeli ou telibo ou akassa', 3000, '/assets/3.png', 'plat', false, null],
      ['Hors d\'oeuvres à Chaud', 'Avec du pain', 3000, '/assets/4.png', 'plat', false, null],
      ['Attieke', 'Avec poulet bicyclette braisé ou lapin braisé', 3000, '/assets/5.png', 'plat', false, 'Le plat avec le tilapia est à partir de 3500'],
      ['Frites avec aloco', 'Avec poulet bicyclette braisé ou lapin braisé', 3000, '/assets/3.png', 'plat', false, 'Le plat avec le tilapia est à partir de 3500'],
      ['Poulet bicyclette braisé Complet', 'Poulet entier braisé sans accompagnement', 6000, '/assets/4.png', 'plat', false, null],
      ['Wassa wassa', 'Avec poulet bicyclette braisé ou lapin braisé', 3000, '/assets/5.png', 'plat', false, 'Le plat avec le tilapia est à partir de 3500'],
      ['Chawarma du chef', 'Viande de boeuf et fromage fondant', 3500, '/assets/3.png', 'plat', true, null],
      ['Chawarma standard', 'Avec Viande de bœuf', 2000, '/assets/4.png', 'plat', false, null],
      ['Riz au gras', 'Avec poulet bicyclette ou lapin braisé', 3000, '/assets/5.png', 'plat', false, 'Le plat avec le tilapia est à partir de 3500'],
      ['Tapio riz au lait', 'Bouillie à base de riz et de tapioca + lait + arachide', 1500, '/assets/2.png', 'dessert', false, null],
      ['Portion piron', 'Pâte faite à base du gari', 500, '/assets/1.png', 'extra', false, null],
      ['Portions frites', 'Portions de frites, aloko, ou de riz', 1000, '/assets/2.png', 'extra', false, null]
    ];

    for (const item of menuItems) {
      await connection.query(`
        INSERT INTO menu (name, description, price, image, category, featured, note) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=name
      `, item);
    }

    console.log(`${colors.green}✓ ${menuItems.length} plats insérés${colors.reset}`);

    // 5. Statistiques finales
    console.log(`\n${colors.blue}📊 Statistiques:${colors.reset}`);
    
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`  👥 Utilisateurs: ${userCount[0].count}`);
    
    const [menuCount] = await connection.query('SELECT COUNT(*) as count FROM menu');
    console.log(`  🍽️  Plats: ${menuCount[0].count}`);
    
    const [orderCount] = await connection.query('SELECT COUNT(*) as count FROM orders');
    console.log(`  📦 Commandes: ${orderCount[0].count}`);

    console.log(`\n${colors.green}✅ Seeding terminé avec succès!${colors.reset}\n`);
    console.log(`${colors.yellow}🔐 Identifiants admin:${colors.reset}`);
    console.log(`   Email: admin@foodirect.com`);
    console.log(`   Mot de passe: admin123\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Erreur lors du seeding:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le seeding
seedDatabase();
