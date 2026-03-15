const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

// Routes publiques
router.get('/', menuController.getAllMenu);
router.get('/featured', menuController.getFeaturedMenu);
router.get('/available', menuController.getAvailableMenu);
router.get('/category/:category', menuController.getMenuByCategory);
router.get('/:id', menuController.getMenuById);

// Routes admin (protégées) avec upload d'image
router.post('/', authenticate, isAdmin, upload.single('image'), menuController.createMenu);
router.put('/:id', authenticate, isAdmin, upload.single('image'), menuController.updateMenu);
router.patch('/:id/featured', authenticate, isAdmin, menuController.toggleFeatured);
router.delete('/:id', authenticate, isAdmin, menuController.deleteMenu);

module.exports = router;
