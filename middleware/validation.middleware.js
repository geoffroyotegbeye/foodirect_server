const { body, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array()
    });
  }
  next();
};

// Validation pour l'inscription
exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('phone').optional().isMobilePhone().withMessage('Numéro de téléphone invalide'),
  handleValidationErrors
];

// Validation pour la connexion
exports.validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
  handleValidationErrors
];

// Validation pour une commande
exports.validateOrder = [
  body('customer_name').trim().notEmpty().withMessage('Le nom du client est requis'),
  body('customer_phone').trim().notEmpty().withMessage('Le téléphone du client est requis'),
  body('customer_address').trim().notEmpty().withMessage('L\'adresse de livraison est requise'),
  body('items').isArray({ min: 1 }).withMessage('La commande doit contenir au moins un article'),
  body('items.*.menu_id').isInt().withMessage('ID du menu invalide'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  handleValidationErrors
];
