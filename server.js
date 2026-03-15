const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');

// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les images statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API FOODIRECT',
    version: '1.0.0',
    status: 'running',
    database: 'MySQL'
  });
});

// Import des routes
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Utiliser les routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Tester la connexion à la base de données
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ Impossible de démarrer le serveur sans connexion à la base de données');
    console.log('\n📝 Étapes pour configurer MySQL:');
    console.log('1. Ouvre phpMyAdmin');
    console.log('2. Importe le fichier: backend/config/init-db.sql');
    console.log('3. Vérifie les identifiants dans backend/.env');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`💾 Base de données: MySQL`);
  });
};

startServer();
