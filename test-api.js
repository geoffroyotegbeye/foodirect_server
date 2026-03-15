// Script de test simple pour l'API
const axios = require('axios');

const API_URL = 'http://localhost:5000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function testAPI() {
  console.log('\n🧪 Test de l\'API FOODIRECT\n');

  // Test 1: API de base
  try {
    console.log('Test 1: API de base...');
    const response = await axios.get(API_URL);
    console.log(`${colors.green}✓ API accessible${colors.reset}`);
    console.log(`  Message: ${response.data.message}`);
  } catch (error) {
    console.log(`${colors.red}✗ API non accessible${colors.reset}`);
    console.log(`  Erreur: ${error.message}`);
    console.log(`\n${colors.yellow}⚠️  Assure-toi que le serveur tourne avec: npm run dev${colors.reset}\n`);
    return;
  }

  // Test 2: Récupérer le menu
  try {
    console.log('\nTest 2: Récupération du menu...');
    const response = await axios.get(`${API_URL}/api/menu`);
    console.log(`${colors.green}✓ Menu récupéré${colors.reset}`);
    console.log(`  Nombre de plats: ${response.data.data.length}`);
  } catch (error) {
    console.log(`${colors.red}✗ Erreur menu${colors.reset}`);
    console.log(`  Erreur: ${error.response?.data?.message || error.message}`);
  }

  // Test 3: Récupérer les plats en vedette
  try {
    console.log('\nTest 3: Plats en vedette...');
    const response = await axios.get(`${API_URL}/api/menu/featured`);
    console.log(`${colors.green}✓ Plats en vedette récupérés${colors.reset}`);
    console.log(`  Nombre de plats: ${response.data.data.length}`);
  } catch (error) {
    console.log(`${colors.red}✗ Erreur plats en vedette${colors.reset}`);
    console.log(`  Erreur: ${error.response?.data?.message || error.message}`);
  }

  // Test 4: Créer une commande test
  try {
    console.log('\nTest 4: Création d\'une commande test...');
    const orderData = {
      customer_name: 'Test Client',
      customer_phone: '+229123456789',
      customer_address: 'Godomey, Abomey-Calavi',
      items: [
        { menu_id: 1, quantity: 2 },
        { menu_id: 3, quantity: 1 }
      ],
      notes: 'Commande de test',
      payment_method: 'especes'
    };
    
    const response = await axios.post(`${API_URL}/api/orders`, orderData);
    console.log(`${colors.green}✓ Commande créée${colors.reset}`);
    console.log(`  ID: ${response.data.data.id}`);
    console.log(`  Total: ${response.data.data.total_amount} FCFA`);
  } catch (error) {
    console.log(`${colors.red}✗ Erreur création commande${colors.reset}`);
    console.log(`  Erreur: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.errors) {
      console.log('  Détails:', error.response.data.errors);
    }
  }

  console.log(`\n${colors.green}✅ Tests terminés!${colors.reset}\n`);
}

// Exécuter les tests
testAPI().catch(console.error);
