const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Récupérer tous les utilisateurs (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    console.log(`👥 [GET] Récupération des utilisateurs - Page ${page}, Limite ${limit}`);
    
    // Compter le total
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;
    
    // Récupérer les utilisateurs avec pagination
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✓ ${rows.length} utilisateur(s) récupéré(s) sur ${total} total (Page ${page}/${totalPages})`);
    
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
    console.error('❌ Erreur getAllUsers:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Créer un utilisateur (Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    console.log(`➕ [POST] Création d'un nouvel utilisateur: "${name}"`);
    console.log(`   Email: ${email}, Rôle: ${role}`);
    
    // Vérifier si l'email existe déjà
    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUser.length > 0) {
      console.log(`⚠️  Email ${email} déjà utilisé`);
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer l'utilisateur
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, role || 'customer']
    );
    
    console.log(`✓ Utilisateur créé avec succès - ID: ${result.insertId}`);
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: { id: result.insertId, name, email, role }
    });
  } catch (error) {
    console.error('❌ Erreur createUser:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Modifier un utilisateur (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    
    console.log(`✏️  [PUT] Mise à jour de l'utilisateur ID: ${req.params.id}`);
    console.log(`   Nom: "${name}", Email: ${email}, Rôle: ${role}`);
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.params.id]
    );
    
    if (existingUser.length > 0) {
      console.log(`⚠️  Email ${email} déjà utilisé par un autre utilisateur`);
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }
    
    // Si un nouveau mot de passe est fourni, le hasher
    let updateQuery = 'UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?';
    let params = [name, email, phone, role, req.params.id];
    
    if (password) {
      console.log(`   🔒 Mise à jour du mot de passe`);
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery = 'UPDATE users SET name = ?, email = ?, phone = ?, role = ?, password = ? WHERE id = ?';
      params = [name, email, phone, role, hashedPassword, req.params.id];
    }
    
    const [result] = await pool.query(updateQuery, params);
    
    if (result.affectedRows === 0) {
      console.log(`⚠️  Utilisateur ID ${req.params.id} non trouvé`);
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    console.log(`✓ Utilisateur ID ${req.params.id} mis à jour avec succès`);
    res.json({ success: true, message: 'Utilisateur modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur updateUser:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Supprimer un utilisateur (Admin)
exports.deleteUser = async (req, res) => {
  try {
    console.log(`🗑️  [DELETE] Suppression de l'utilisateur ID: ${req.params.id}`);
    
    // Empêcher la suppression de son propre compte
    if (req.user.id === parseInt(req.params.id)) {
      console.log(`⚠️  Tentative de suppression de son propre compte refusée`);
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    // Récupérer le nom avant suppression
    const [user] = await pool.query('SELECT name FROM users WHERE id = ?', [req.params.id]);
    
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      console.log(`⚠️  Utilisateur ID ${req.params.id} non trouvé`);
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    console.log(`✓ Utilisateur "${user[0]?.name || req.params.id}" supprimé avec succès`);
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteUser:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Activer/Désactiver un utilisateur (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    
    console.log(`🔄 [PATCH] Toggle statut utilisateur ID: ${req.params.id}`);
    console.log(`   Nouvelle valeur: ${is_active ? 'ACTIF' : 'INACTIF'}`);
    
    // Empêcher la désactivation de son propre compte
    if (req.user.id === parseInt(req.params.id)) {
      console.log(`⚠️  Tentative de désactivation de son propre compte refusée`);
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }
    
    const [result] = await pool.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      console.log(`⚠️  Utilisateur ID ${req.params.id} non trouvé`);
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    console.log(`✓ Statut ${is_active ? 'activé' : 'désactivé'} pour utilisateur ID ${req.params.id}`);
    res.json({ success: true, message: 'Statut modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur toggleUserStatus:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
