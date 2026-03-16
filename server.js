const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const { migrate } = require('./config/migrate');

// Charger les variables d'environnement selon l'environnement
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

// Initialiser Express
const app = express();

// Middlewares
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace(/\/$/, ''), // sans slash final
    'http://localhost:3000',
  ].filter(Boolean),
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
const accompanimentRoutes = require('./routes/accompaniment.routes');
const settingsRoutes = require('./routes/settings.routes');

// Utiliser les routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accompaniments', accompanimentRoutes);
app.use('/api/settings', settingsRoutes);

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

const waitForDB = async (retries = 10, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    const ok = await testConnection();
    if (ok) return true;
    console.log(`⏳ Tentative ${i}/${retries} — nouvelle tentative dans ${delay / 1000}s...`);
    await new Promise(r => setTimeout(r, delay));
  }
  return false;
};

const startServer = async () => {
  // Démarrer le serveur HTTP immédiatement (Railway attend un port ouvert)
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  });

  // Attendre la DB avec retry
  const dbConnected = await waitForDB();
  if (!dbConnected) {
    console.error('❌ Impossible de se connecter à la base de données après plusieurs tentatives');
    process.exit(1);
  }

  await migrate();
  console.log('✅ Serveur prêt — DB connectée et migrations appliquées');
};

startServer();
