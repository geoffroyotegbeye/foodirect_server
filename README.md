# FOODIRECT Backend API

Backend Node.js + Express + MySQL pour l'application FOODIRECT.

## 🚀 Installation

```bash
cd backend
npm install
```

## 📦 Configuration

1. Ouvre phpMyAdmin
2. Importe le fichier `config/init-db.sql` pour créer la base de données
3. Vérifie les identifiants dans `.env`

## 🔧 Variables d'environnement

Le fichier `.env` contient:
- `PORT`: Port du serveur (défaut: 5000)
- `DB_HOST`: Hôte MySQL (défaut: localhost)
- `DB_USER`: Utilisateur MySQL (défaut: root)
- `DB_PASSWORD`: Mot de passe MySQL (défaut: vide)
- `DB_NAME`: Nom de la base de données (défaut: foodirect)
- `JWT_SECRET`: Clé secrète pour JWT (à changer en production)
- `FRONTEND_URL`: URL du frontend pour CORS

## 🎯 Démarrage

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 📚 Routes API

### Menu
- `GET /api/menu` - Récupérer tous les plats
- `GET /api/menu/featured` - Récupérer les plats en vedette
- `GET /api/menu/category/:category` - Récupérer par catégorie
- `GET /api/menu/:id` - Récupérer un plat
- `POST /api/menu` - Créer un plat (admin)
- `PUT /api/menu/:id` - Modifier un plat (admin)
- `DELETE /api/menu/:id` - Supprimer un plat (admin)

### Commandes
- `POST /api/orders` - Créer une commande
- `GET /api/orders` - Récupérer toutes les commandes (admin)
- `GET /api/orders/:id` - Récupérer une commande
- `PATCH /api/orders/:id/status` - Modifier le statut (admin)
- `PATCH /api/orders/:id/payment` - Modifier le statut de paiement (admin)
- `DELETE /api/orders/:id` - Supprimer une commande (admin)

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Récupérer le profil (authentifié)
- `PUT /api/auth/profile` - Modifier le profil (authentifié)
- `POST /api/auth/change-password` - Changer le mot de passe (authentifié)

## 🔐 Authentification

Les routes protégées nécessitent un token JWT dans le header:
```
Authorization: Bearer <token>
```

## 👤 Utilisateur admin par défaut

- Email: `admin@foodirect.com`
- Mot de passe: (à définir lors de la première connexion)

## 🗄️ Structure de la base de données

- `users` - Utilisateurs (admin, staff, customer)
- `menu` - Plats du menu
- `orders` - Commandes
- `order_items` - Articles des commandes

## 📝 Exemple de requête

### Créer une commande
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Jean Dupont",
    "customer_phone": "+229123456789",
    "customer_address": "Godomey, Abomey-Calavi",
    "items": [
      {"menu_id": 1, "quantity": 2},
      {"menu_id": 3, "quantity": 1}
    ],
    "notes": "Livraison rapide svp",
    "payment_method": "especes"
  }'
```

## 🛠️ Technologies

- Node.js
- Express.js
- MySQL (mysql2)
- JWT (jsonwebtoken)
- bcryptjs
- express-validator
- CORS
