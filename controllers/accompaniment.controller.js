const { pool } = require('../config/database');
const { deleteImage } = require('../middleware/upload.middleware');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM accompaniments ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, price, available } = req.body;
    const image = req.file ? req.file.path : null;
    const isAvailable = available === '1' || available === 'true' || available === true ? 1 : 0;
    const [result] = await pool.query(
      'INSERT INTO accompaniments (name, description, price, image, available) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', price || 0, image, isAvailable]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    console.error('❌ create accompaniment error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, price, available } = req.body;
    const isAvailable = available === '1' || available === 'true' || available === true ? 1 : 0;

    let imagePath = null;
    if (req.file) {
      // Supprimer l'ancienne image Cloudinary
      const [old] = await pool.query('SELECT image FROM accompaniments WHERE id=?', [req.params.id]);
      if (old.length > 0) await deleteImage(old[0].image);
      imagePath = req.file.path;
    }

    let query = 'UPDATE accompaniments SET name=?, description=?, price=?, available=?';
    let params = [name, description || '', price || 0, isAvailable];
    if (imagePath) { query += ', image=?'; params.push(imagePath); }
    query += ' WHERE id=?';
    params.push(req.params.id);

    await pool.query(query, params);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ update accompaniment error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [old] = await pool.query('SELECT image FROM accompaniments WHERE id=?', [req.params.id]);
    if (old.length > 0) await deleteImage(old[0].image);
    await pool.query('DELETE FROM accompaniments WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getByMenu = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.* FROM accompaniments a
      INNER JOIN menu_accompaniments ma ON ma.accompaniment_id = a.id
      WHERE ma.menu_id = ? AND a.available = TRUE
    `, [req.params.menuId]);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.setMenuAccompaniments = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { accompaniment_ids } = req.body;
    const menuId = req.params.menuId;
    await connection.query('DELETE FROM menu_accompaniments WHERE menu_id=?', [menuId]);
    if (accompaniment_ids && accompaniment_ids.length > 0) {
      const values = accompaniment_ids.map(aid => [menuId, aid]);
      await connection.query('INSERT INTO menu_accompaniments (menu_id, accompaniment_id) VALUES ?', [values]);
    }
    await connection.commit();
    res.json({ success: true });
  } catch (e) {
    await connection.rollback();
    res.status(500).json({ success: false, message: e.message });
  } finally {
    connection.release();
  }
};
