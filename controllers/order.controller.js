const { pool } = require('../config/database');

// Créer une nouvelle commande
exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { customer_name, customer_phone, customer_address, items, notes, payment_method } = req.body;
    
    // Calculer le montant total
    let total_amount = 0;
    for (const item of items) {
      const [menuItem] = await connection.query('SELECT price FROM menu WHERE id = ?', [item.menu_id]);
      if (menuItem.length === 0) {
        throw new Error(`Plat avec ID ${item.menu_id} non trouvé`);
      }
      total_amount += menuItem[0].price * item.quantity;
    }
    
    // Créer la commande
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount, notes, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_name, customer_phone, customer_address, total_amount, notes || null, payment_method || 'especes']
    );
    
    const orderId = orderResult.insertId;
    
    // Ajouter les items de la commande
    for (const item of items) {
      const [menuItem] = await connection.query('SELECT name, price FROM menu WHERE id = ?', [item.menu_id]);
      
      await connection.query(
        'INSERT INTO order_items (order_id, menu_id, name, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.menu_id, menuItem[0].name, item.quantity, menuItem[0].price]
      );
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: { id: orderId, total_amount }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur createOrder:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur serveur' });
  } finally {
    connection.release();
  }
};

// Récupérer toutes les commandes (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur getAllOrders:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer une commande par ID
exports.getOrderById = async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    
    res.json({
      success: true,
      data: {
        ...orders[0],
        items
      }
    });
  } catch (error) {
    console.error('Erreur getOrderById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut d'une commande (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree', 'annulee'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }
    
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    res.json({ success: true, message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updateOrderStatus:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut de paiement (Admin)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status } = req.body;
    
    const validStatuses = ['en_attente', 'payee', 'echouee'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ success: false, message: 'Statut de paiement invalide' });
    }
    
    const [result] = await pool.query(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      [payment_status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    res.json({ success: true, message: 'Statut de paiement mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updatePaymentStatus:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Supprimer une commande (Admin)
exports.deleteOrder = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    res.json({ success: true, message: 'Commande supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deleteOrder:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
