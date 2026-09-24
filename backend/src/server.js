import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import logger from './utils/logger.js';

let server;

const startServer = async () => {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // 2. Start HTTP Listener
    server = app.listen(env.PORT, () => {
      logger.info(`========================================================`);
      logger.info(` BhumiPatra Backend API Server Running`);
      logger.info(` Environment : ${env.NODE_ENV}`);
      logger.info(` Port        : ${env.PORT}`);
      logger.info(` Health Check: http://localhost:${env.PORT}/api/health`);
      logger.info(`========================================================`);
    });
  } catch (error) {
    logger.error(`Failed to launch BhumiPatra server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful Shutdown
const handleShutdown = (signal) => {
  logger.info(`Received ${signal}. Gracefully closing HTTP server and database connections...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`, { stack: err.stack });
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

startServer();
