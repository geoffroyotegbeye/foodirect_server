const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { validateOrder } = require('../middleware/validation.middleware');

// Route publique pour créer une commande
router.post('/', validateOrder, orderController.createOrder);

// Routes protégées (admin)
router.get('/', authenticate, isAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.patch('/:id/status', authenticate, isAdmin, orderController.updateOrderStatus);
router.patch('/:id/payment', authenticate, isAdmin, orderController.updatePaymentStatus);
router.delete('/:id', authenticate, isAdmin, orderController.deleteOrder);

module.exports = router;
