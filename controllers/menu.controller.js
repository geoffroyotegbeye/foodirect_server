const { pool } = require('../config/database');
const { deleteImage } = require('../middleware/upload.middleware');

// Récupérer tous les plats du menu
exports.getAllMenu = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    console.log(`📋 [GET] Récupération des plats - Page ${page}, Limite ${limit}`);
    
    // Compter le total (TOUS les plats, pas seulement disponibles)
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM menu'
    );
    const total = countResult[0].total;
    
    // Récupérer les plats avec pagination (TOUS les plats)
    const [rows] = await pool.query(
      'SELECT * FROM menu ORDER BY category, name LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✓ ${rows.length} plat(s) récupéré(s) sur ${total} total (Page ${page}/${totalPages})`);
    
    res.json({ 
      success: true, 
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Erreur getAllMenu:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer les plats en vedette
exports.getFeaturedMenu = async (req, res) => {
  try {
    console.log('⭐ [GET] Récupération des plats en vedette (Menu du Jour)');
    const [rows] = await pool.query(
      'SELECT id, name, description, price, image, category FROM menu WHERE featured = TRUE AND available = TRUE LIMIT 6'
    );
    console.log(`✓ ${rows.length} plat(s) en vedette récupéré(s)`);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Erreur getFeaturedMenu:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer les plats disponibles (pour landing page) - OPTIMISÉ
exports.getAvailableMenu = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    console.log(`🌐 [GET] Récupération des plats disponibles (Landing) - Limite ${limit}`);
    
    const [rows] = await pool.query(
      'SELECT id, name, description, price, image, category, featured, note FROM menu WHERE available = TRUE ORDER BY featured DESC, category, name LIMIT ?',
      [limit]
    );
    
    console.log(`✓ ${rows.length} plat(s) disponible(s) récupéré(s)`);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Erreur getAvailableMenu:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer un plat par ID
exports.getMenuById = async (req, res) => {
  try {
    console.log(`🔍 [GET] Récupération du plat ID: ${req.params.id}`);
    const [rows] = await pool.query('SELECT * FROM menu WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      console.log(`⚠️  Plat ID ${req.params.id} non trouvé`);
      return res.status(404).json({ success: false, message: 'Plat non trouvé' });
    }
    
    console.log(`✓ Plat "${rows[0].name}" récupéré`);
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('❌ Erreur getMenuById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer les plats par catégorie
exports.getMenuByCategory = async (req, res) => {
  try {
    console.log(`📂 [GET] Récupération des plats de catégorie: ${req.params.category}`);
    const [rows] = await pool.query(
      'SELECT * FROM menu WHERE category = ? AND available = TRUE ORDER BY name',
      [req.params.category]
    );
    console.log(`✓ ${rows.length} plat(s) de catégorie "${req.params.category}" récupéré(s)`);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Erreur getMenuByCategory:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Créer un nouveau plat (Admin)
exports.createMenu = async (req, res) => {
  try {
    const { name, description, price, category, featured, note } = req.body;
    
    // Gérer l'image uploadée
    let imagePath = '/assets/default.png'; // Image par défaut
    if (req.file) {
      imagePath = `/uploads/menu/${req.file.filename}`;
    }
    
    // Convertir les booléens en entiers pour MySQL
    const featuredValue = featured === 'true' || featured === true || featured === 1 ? 1 : 0;
    
    console.log(`➕ [POST] Création d'un nouveau plat: "${name}"`);
    console.log(`   Catégorie: ${category}, Prix: ${price} FCFA, Featured: ${featuredValue}`);
    console.log(`   Image: ${imagePath}`);
    
    const [result] = await pool.query(
      'INSERT INTO menu (name, description, price, image, category, featured, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, imagePath, category || 'plat', featuredValue, note || null]
    );
    
    console.log(`✓ Plat créé avec succès - ID: ${result.insertId}`);
    res.status(201).json({
      success: true,
      message: 'Plat créé avec succès',
      data: { id: result.insertId, name, image: imagePath }
    });
  } catch (error) {
    console.error('❌ Erreur createMenu:', error);
    
    // Supprimer l'image uploadée en cas d'erreur
    if (req.file) {
      deleteImage(`menu/${req.file.filename}`);
    }
    
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Mettre à jour un plat (Admin)
exports.updateMenu = async (req, res) => {
  try {
    const { name, description, price, category, available, featured, note } = req.body;
    
    // Convertir les booléens en entiers pour MySQL
    const availableValue = available === 'true' || available === true || available === 1 ? 1 : 0;
    const featuredValue = featured === 'true' || featured === true || featured === 1 ? 1 : 0;
    
    console.log(`✏️  [PUT] Mise à jour du plat ID: ${req.params.id}`);
    console.log(`   Nom: "${name}", Prix: ${price} FCFA, Disponible: ${availableValue}, Featured: ${featuredValue}`);
    
    // Récupérer l'ancienne image
    const [oldPlat] = await pool.query('SELECT image FROM menu WHERE id = ?', [req.params.id]);
    
    if (oldPlat.length === 0) {
      console.log(`⚠️  Plat ID ${req.params.id} non trouvé`);
      return res.status(404).json({ success: false, message: 'Plat non trouvé' });
    }
    
    let imagePath = oldPlat[0].image; // Garder l'ancienne image par défaut
    
    // Si une nouvelle image est uploadée
    if (req.file) {
      imagePath = `/uploads/menu/${req.file.filename}`;
      console.log(`   📸 Nouvelle image: ${imagePath}`);
      
      // Supprimer l'ancienne image (sauf si c'est une image par défaut)
      if (oldPlat[0].image && !oldPlat[0].image.includes('/assets/')) {
        deleteImage(oldPlat[0].image);
      }
    }
    
    const [result] = await pool.query(
      'UPDATE menu SET name = ?, description = ?, price = ?, image = ?, category = ?, available = ?, featured = ?, note = ? WHERE id = ?',
      [name, description, price, imagePath, category, availableValue, featuredValue, note, req.params.id]
    );
    
    console.log(`✓ Plat ID ${req.params.id} mis à jour avec succès`);
    res.json({ success: true, message: 'Plat mis à jour avec succès', data: { image: imagePath } });
  } catch (error) {
    console.error('❌ Erreur updateMenu:', error);
    
    // Supprimer la nouvelle image en cas d'erreur
    if (req.file) {
      deleteImage(`menu/${req.file.filename}`);
    }
    
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Supprimer un plat (Admin)
exports.deleteMenu = async (req, res) => {
  try {
    console.log(`🗑️  [DELETE] Suppression du plat ID: ${req.params.id}`);
    
    // Récupérer le plat avant suppression pour obtenir l'image
    const [plat] = await pool.query('SELECT name, image FROM menu WHERE id = ?', [req.params.id]);
    
    if (plat.length === 0) {
      console.log(`⚠️  Plat ID ${req.params.id} non trouvé`);
      return res.status(404).json({ success: false, message: 'Plat non trouvé' });
    }
    
    // Supprimer le plat de la BDD
    const [result] = await pool.query('DELETE FROM menu WHERE id = ?', [req.params.id]);
    
    // Supprimer l'image associée (sauf si c'est une image par défaut)
    if (plat[0].image && !plat[0].image.includes('/assets/')) {
      deleteImage(plat[0].image);
    }
    
    console.log(`✓ Plat "${plat[0].name}" et son image supprimés avec succès`);
    res.json({ success: true, message: 'Plat supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteMenu:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Toggle featured (Menu du Jour)
exports.toggleFeatured = async (req, res) => {
  try {
    const { featured } = req.body;
    
    // Convertir en entier pour MySQL
    const featuredValue = featured === 'true' || featured === true || featured === 1 ? 1 : 0;
    
    console.log(`⭐ [PATCH] Toggle Menu du Jour pour plat ID: ${req.params.id}`);
    console.log(`   Nouvelle valeur: ${featuredValue ? 'OUI (Menu du Jour)' : 'NON'}`);
    
    const [result] = await pool.query(
      'UPDATE menu SET featured = ? WHERE id = ?',
      [featuredValue, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      console.log(`⚠️  Plat ID ${req.params.id} non trouvé`);
      return res.status(404).json({ success: false, message: 'Plat non trouvé' });
    }
    
    console.log(`✓ Menu du Jour ${featuredValue ? 'activé' : 'désactivé'} pour plat ID ${req.params.id}`);
    res.json({ success: true, message: 'Menu du jour mis à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur toggleFeatured:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
