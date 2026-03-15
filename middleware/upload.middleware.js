const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Seules les images (JPEG, JPG, PNG, GIF, WEBP) sont autorisées!'));
};

const createStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `foodirect/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const upload             = multer({ storage: createStorage('menu'),          limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
const uploadAccompagnement = multer({ storage: createStorage('accompagnement'), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
const uploadSettings     = multer({ storage: createStorage('settings'),      limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// Supprimer une image Cloudinary via son URL ou public_id
const deleteImage = async (imagePath) => {
  try {
    if (!imagePath) return;
    // Ne pas supprimer les images statiques locales
    if (imagePath.startsWith('/assets/')) return;

    let publicId;

    if (imagePath.includes('cloudinary.com')) {
      // Extraire le public_id depuis l'URL Cloudinary
      // ex: https://res.cloudinary.com/drtfctuw7/image/upload/v123/foodirect/menu/filename
      const matches = imagePath.match(/foodirect\/[^/.]+\/[^/.]+/);
      if (matches) publicId = matches[0];
    }

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️  Image Cloudinary supprimée: ${publicId}`);
    }
  } catch (error) {
    console.error('❌ Erreur suppression Cloudinary:', error.message);
  }
};

module.exports = { upload, uploadAccompagnement, uploadSettings, deleteImage };
