const bcrypt = require('bcryptjs');

// Générer le hash pour le mot de passe "admin123"
const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('\n🔐 Hash généré pour le mot de passe "admin123":');
console.log(hash);
console.log('\nCopie ce hash dans le fichier init-db.sql\n');
