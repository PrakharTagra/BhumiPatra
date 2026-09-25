import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bhumipatra',
  JWT_SECRET: process.env.JWT_SECRET || 'bhumipatra_development_secure_jwt_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGINS: process.env.CLIENT_ORIGINS
    ? process.env.CLIENT_ORIGINS.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ],
  UPLOAD_DIR:
    process.env.UPLOAD_DIR ||
    (fs.existsSync(path.join(process.cwd(), 'backend', 'uploads'))
      ? path.join(process.cwd(), 'backend', 'uploads')
      : path.join(process.cwd(), 'uploads')),
  OCR_PROVIDER: process.env.OCR_PROVIDER || null,
  AI_PROVIDER: process.env.AI_PROVIDER || null,
  MAX_FILE_SIZE_MB: 50,
  DOCUMENT_ANALYSIS_ENGINE_URL: process.env.DOCUMENT_ANALYSIS_ENGINE_URL || 'http://localhost:8000',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'bhumipatra_internal_secret_key_2026',
};

export default env;
