const { pool } = require('./config/database');

async function testPagination() {
  try {
    // Compter les plats
    const [menuCount] = await pool.query('SELECT COUNT(*) as total FROM menu');
    console.log(`\n📊 Total plats dans la BDD: ${menuCount[0].total}`);
    
    // Compter les utilisateurs
    const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`📊 Total utilisateurs dans la BDD: ${userCount[0].total}`);
    
    // Tester la requête de pagination
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.query(
      'SELECT * FROM menu ORDER BY category, name LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    console.log(`\n✓ Requête pagination retourne: ${rows.length} plats`);
    console.log(`✓ Pages nécessaires: ${Math.ceil(menuCount[0].total / limit)}`);
    
    if (menuCount[0].total <= 10) {
      console.log(`\n⚠️  ATTENTION: Vous avez seulement ${menuCount[0].total} plats.`);
      console.log(`   La pagination n'apparaît que si vous avez plus de 10 plats.`);
      console.log(`   Lancez "npm run seed" pour ajouter des plats de test.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testPagination();
