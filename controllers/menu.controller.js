const { pool } = require('../config/database');
const { deleteImage } = require('../middleware/upload.middleware');

exports.getAllMenu = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM menu');
    const total = countResult[0].total;
    const [rows] = await pool.query('SELECT * FROM menu ORDER BY category, name LIMIT ? OFFSET ?', [limit, offset]);
    const totalPages = Math.ceil(total / limit);
    res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getFeaturedMenu = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, description, price, image, category FROM menu WHERE featured = TRUE AND available = TRUE LIMIT 6');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getAvailableMenu = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const [rows] = await pool.query(
      'SELECT id, name, description, price, image, category, featured, note FROM menu WHERE available = TRUE ORDER BY featured DESC, category, name LIMIT ?',
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMenuById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Plat non trouvé' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMenuByCategory = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu WHERE category = ? AND available = TRUE ORDER BY name', [req.params.category]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.createMenu = async (req, res) => {
  try {
    const { name, description, price, category, featured, note } = req.body;
    const imagePath = req.file ? req.file.path : '/assets/1.png';
    const featuredValue = featured === 'true' || featured === true || featured === 1 ? 1 : 0;

    const [result] = await pool.query(
      'INSERT INTO menu (name, description, price, image, category, featured, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, imagePath, category || 'plat', featuredValue, note || null]
    );

    res.status(201).json({ success: true, message: 'Plat créé avec succès', data: { id: result.insertId, name, image: imagePath } });
  } catch (error) {
    console.error('❌ Erreur createMenu:', error);
    if (req.file) await deleteImage(req.file.path);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { name, description, price, category, available, featured, note } = req.body;
    const availableValue = available === 'true' || available === true || available === 1 ? 1 : 0;
    const featuredValue  = featured  === 'true' || featured  === true || featured  === 1 ? 1 : 0;

    const [oldPlat] = await pool.query('SELECT image FROM menu WHERE id = ?', [req.params.id]);
    if (oldPlat.length === 0) return res.status(404).json({ success: false, message: 'Plat non trouvé' });

    let imagePath = oldPlat[0].image;
    if (req.file) {
      await deleteImage(oldPlat[0].image);
      imagePath = req.file.path;
    }

    await pool.query(
      'UPDATE menu SET name=?, description=?, price=?, image=?, category=?, available=?, featured=?, note=? WHERE id=?',
      [name, description, price, imagePath, category, availableValue, featuredValue, note, req.params.id]
    );

    res.json({ success: true, message: 'Plat mis à jour avec succès', data: { image: imagePath } });
  } catch (error) {
    console.error('❌ Erreur updateMenu:', error);
    if (req.file) await deleteImage(req.file.path);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const [plat] = await pool.query('SELECT name, image FROM menu WHERE id = ?', [req.params.id]);
    if (plat.length === 0) return res.status(404).json({ success: false, message: 'Plat non trouvé' });

    await pool.query('DELETE FROM menu WHERE id = ?', [req.params.id]);
    await deleteImage(plat[0].image);

    res.json({ success: true, message: 'Plat supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteMenu:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.toggleFeatured = async (req, res) => {
  try {
    const featuredValue = req.body.featured === 'true' || req.body.featured === true || req.body.featured === 1 ? 1 : 0;
    const [result] = await pool.query('UPDATE menu SET featured=? WHERE id=?', [featuredValue, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Plat non trouvé' });
    res.json({ success: true, message: 'Menu du jour mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
