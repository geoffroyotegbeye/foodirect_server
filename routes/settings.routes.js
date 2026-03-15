const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settings.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { uploadSettings } = require('../middleware/upload.middleware');

// Publique
router.get('/', ctrl.getAll);

// Admin
router.patch('/image/:key', authenticate, isAdmin, uploadSettings.single('image'), ctrl.updateImage);

module.exports = router;
