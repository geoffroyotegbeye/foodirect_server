const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accompaniment.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { uploadAccompagnement } = require('../middleware/upload.middleware');

// Publique
router.get('/', ctrl.getAll);
router.get('/menu/:menuId', ctrl.getByMenu);

// Admin - routes spécifiques AVANT les routes génériques
router.put('/menu/:menuId/accompaniments', authenticate, isAdmin, ctrl.setMenuAccompaniments);
router.post('/', authenticate, isAdmin, uploadAccompagnement.single('image'), ctrl.create);
router.put('/:id', authenticate, isAdmin, uploadAccompagnement.single('image'), ctrl.update);
router.delete('/:id', authenticate, isAdmin, ctrl.remove);

module.exports = router;
