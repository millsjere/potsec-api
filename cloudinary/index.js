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
    public_id: (req, file) => `profile_photo/${req.params.id}`
  },
});

const staffPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req, file) => `potsec/staff/${req.params.id}`,
    allowedFormats: ["jpeg", "png", "jpg"],
    public_id: (req, file) => `staff_photo/${req.params.id}`
  },
});

const gradesStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req, file) => {
      // console.log('Folder path:', `potsec/grades/${req.body.course_code}`);
      return `potsec/grading/${req.body.course_code}`
    },
    resource_type: 'raw', // Important: Allow non-image files (e.g., csv, xlsx)
    allowedFormats: ["csv", "xlsx", "xls", "numbers"],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const fileName = file.originalname.split('.')[0]; // Remove file extension
      const publicID = `${fileName}-${timestamp}`;
      // console.log('PublicID ==>', publicID)
      return publicID;
    },
  },
});


module.exports = { studentPhotoStorage, staffPhotoStorage, gradesStorage }

