-- Créer la base de données
CREATE DATABASE IF NOT EXISTS foodirect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE foodirect;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'editor', 'viewer', 'staff', 'customer') DEFAULT 'customer',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table du menu
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des commandes
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des items de commande
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menu(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer un utilisateur admin par défaut
-- Mot de passe: admin123
INSERT INTO users (name, email, password, phone, role) 
VALUES ('Admin FOODIRECT', 'admin@foodirect.com', '$2a$10$ZJWtu3.elGXstpvwcstAJeJf69b3mFAz/Ea3lteHkN6fYsDFL3yHO', '+2290191260434', 'admin')
ON DUPLICATE KEY UPDATE name=name;

-- Insérer les plats du menu
INSERT INTO menu (name, description, price, image, category, featured, note) VALUES
('Pack Banger', 'Riz + Hors d''oeuvres chaud + lapin/poulet bicyclette + wassa wassa + 2 ailerons + Chawarma viande', 10000, '/assets/3.png', 'plat', TRUE, NULL),
('Sauce Gbota Royal (tête de mouton)', 'Avec Akassa ou Piron', 5000, '/assets/4.png', 'plat', TRUE, NULL),
('Sauce Assrokouin bien garnie', 'Avec telibo', 3000, '/assets/5.png', 'plat', FALSE, NULL),
('Telibo avec sauce gombo', 'Avec telibo ou Akassa', 3000, '/assets/3.png', 'plat', FALSE, NULL),
('Agbeli', 'Avec sauce gombo ou sauce mouton fromage', 3000, '/assets/4.png', 'plat', FALSE, NULL),
('Riz au Gras Créole', 'Notre spécialité la plus appréciée', 800, '/assets/3.png', 'plat', TRUE, 'Le plat avec le tilapia est à partir de 3500'),
('Igname et Jus d''Œuf', 'Un plat réconfortant du terroir', 500, '/assets/4.png', 'plat', TRUE, NULL),
('Couscous Garni', 'Préparé comme à la maison', 700, '/assets/5.png', 'plat', TRUE, NULL),
('Attieke', 'Avec poulet bicyclette braisé ou lapin braisé', 3000, '/assets/5.png', 'plat', FALSE, 'Le plat avec le tilapia est à partir de 3500'),
('Chawarma du chef', 'Viande de boeuf et fromage fondant', 3500, '/assets/3.png', 'plat', TRUE, NULL),
('Chawarma standard', 'Avec Viande de bœuf', 2000, '/assets/4.png', 'plat', FALSE, NULL),
('Poulet bicyclette braisé Complet', 'Poulet entier braisé sans accompagnement', 6000, '/assets/4.png', 'plat', FALSE, NULL),
('Tapio riz au lait', 'Bouillie à base de riz et de tapioca + lait + arachide', 1500, '/assets/2.png', 'dessert', FALSE, NULL),
('Portion piron', 'Pâte faite à base du gari', 500, '/assets/1.png', 'extra', FALSE, NULL),
('Portions frites', 'Portions de frites, aloko, ou de riz', 1000, '/assets/2.png', 'extra', FALSE, NULL)
ON DUPLICATE KEY UPDATE name=name;
