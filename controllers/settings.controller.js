const { pool } = require('../config/database');
const { deleteImage } = require('../middleware/upload.middleware');

// Récupérer tous les settings
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Mettre à jour une image (delivery_image ou hero_image)
exports.updateImage = async (req, res) => {
  try {
    const { key } = req.params;
    if (!['delivery_image', 'hero_image', 'about_image'].includes(key)) {
      return res.status(400).json({ success: false, message: 'Clé invalide' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }

    const newPath = req.file.path; // URL Cloudinary

    // Supprimer l'ancienne image si elle existe
    const [rows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', [key]);
    if (rows.length > 0 && rows[0].value) {
      await deleteImage(rows[0].value);
    }

    await pool.query(
      'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, newPath, newPath]
    );

    res.json({ success: true, data: { key, value: newPath } });
  } catch (e) {
    console.error('❌ updateImage settings error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};
