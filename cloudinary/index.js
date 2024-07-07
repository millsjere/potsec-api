const dotenv = require('dotenv')
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
dotenv.config({ path: "./config.env" })

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const studentPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req, file) => `potsec/students/${req.params.id}`,
    allowedFormats: ["jpeg", "png", "jpg"],
    public_id: (req, file) => `profile_photo`
  },
});

const staffPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req, file) => `potsec/staff/${req.params.id}`,
    allowedFormats: ["jpeg", "png", "jpg"],
    public_id: (req, file) => `staff_photo`
  },
});


module.exports = { studentPhotoStorage, staffPhotoStorage }

