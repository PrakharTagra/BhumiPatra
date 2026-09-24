/**
 * Structured logger utility
 */
export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? meta : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? meta : '');
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
};

export default logger;
