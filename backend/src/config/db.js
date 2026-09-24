import mongoose from 'mongoose';
import env from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
    });
    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // In production or development without local Mongo, provide clear notice
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] MongoDB runtime error: ${err.message}`);
});

export default connectDB;
