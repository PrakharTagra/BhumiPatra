import multer from 'multer';
import path from 'path';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';
import env from '../config/env.js';

// Memory storage keeps buffer in memory so storageService can direct it to local disk or S3
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeValid = ALLOWED_MIME_TYPES.includes(mime) || mime.startsWith('image/');

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file format (${ext}). Supported document formats are: PDF, JPG, JPEG, PNG, TIFF.`
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // 50MB limit
    files: 1,
  },
});

export default upload;
