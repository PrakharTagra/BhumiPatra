import fs from 'fs';
import path from 'path';
import env from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Storage Service Interface
 * Modular architecture allowing seamless swap between Local FileSystem and S3/Cloud Storage.
 */
class LocalStorageDriver {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.ensureDirectory(this.baseDir);
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Save buffer or stream to storage
   */
  async saveFile(fileBuffer, filename, subDir = '') {
    const targetDir = path.join(this.baseDir, subDir);
    this.ensureDirectory(targetDir);

    const filePath = path.join(targetDir, filename);
    await fs.promises.writeFile(filePath, fileBuffer);

    // Return storageKey and public access URL
    const storageKey = subDir ? `${subDir}/${filename}` : filename;
    const fileUrl = `/uploads/${storageKey.replace(/\\/g, '/')}`;

    return {
      storageKey,
      fileUrl,
      filePath,
    };
  }

  /**
   * Read file stream or buffer
   */
  async getFile(storageKey) {
    const filePath = path.join(this.baseDir, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at storage key: ${storageKey}`);
    }
    return fs.promises.readFile(filePath);
  }

  /**
   * Delete file
   */
  async deleteFile(storageKey) {
    const filePath = path.join(this.baseDir, storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

// In future: class S3StorageDriver implements the same interface
export const storageService = new LocalStorageDriver(env.UPLOAD_DIR);
export default storageService;
