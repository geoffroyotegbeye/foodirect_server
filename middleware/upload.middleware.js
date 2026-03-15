const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/menu');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images (JPEG, JPG, PNG, GIF, WEBP) sont autorisées!'));
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: fileFilter
});

// Fonction pour supprimer une image
const deleteImage = (imagePath) => {
  try {
    // Si c'est une URL complète, extraire juste le nom du fichier
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      const url = new URL(imagePath);
      imagePath = url.pathname;
    }
    
    // Si le chemin commence par /uploads/, le retirer
    if (imagePath.startsWith('/uploads/')) {
      imagePath = imagePath.replace('/uploads/', '');
    }
    
    // Ne pas supprimer les images par défaut dans /assets/
    if (imagePath.startsWith('/assets/') || imagePath.includes('/assets/')) {
      console.log('⚠️  Image par défaut, pas de suppression');
      return;
    }
    
    const fullPath = path.join(__dirname, '../uploads', imagePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️  Image supprimée: ${imagePath}`);
    }
  } catch (error) {
    console.error('❌ Erreur suppression image:', error.message);
  }
};

module.exports = {
  upload,
  deleteImage
};
