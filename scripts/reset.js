const mysql = require('mysql2/promise');
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function resetDatabase() {
  let connection;

  try {
    console.log(`\n${colors.yellow}⚠️  ATTENTION: Cette action va supprimer toutes les données!${colors.reset}`);
    console.log(`${colors.yellow}Appuyez sur Ctrl+C pour annuler...${colors.reset}\n`);

    // Attendre 3 secondes
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`${colors.red}🗑️  Réinitialisation de la base de données...${colors.reset}\n`);

    // Créer la connexion
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log(`${colors.green}✓ Connecté à MySQL${colors.reset}`);

    // Supprimer la base de données
    const dbName = process.env.DB_NAME || 'foodirect';
    await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`${colors.green}✓ Base de données supprimée${colors.reset}`);

    console.log(`\n${colors.green}✅ Réinitialisation terminée!${colors.reset}`);
    console.log(`\n${colors.yellow}Exécute maintenant:${colors.reset}`);
    console.log(`  npm run seed\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Erreur:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter la réinitialisation
resetDatabase();
