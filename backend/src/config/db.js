import mongoose from 'mongoose';
import env from './env.js';

let memoryServerInstance = null;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Notice] Direct MongoDB connection failed (${error.message}). Initializing embedded database engine...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create({
        binary: { arch: 'x64', version: '7.0.14' },
        instance: { dbName: 'bhumipatra' },
      });
      const uri = memoryServerInstance.getUri();
      const conn = await mongoose.connect(uri, { autoIndex: true });
      console.log(`[Database] Embedded database engine initialized and connected at: ${uri}`);
      await initDefaultUsers();
      return conn;
    } catch (memErr) {
      console.error(`[Database Error] Embedded database startup failed: ${memErr.message}`);
      if (env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
};

async function initDefaultUsers() {
  try {
    const { default: User } = await import('../models/User.js');
    const { default: bcrypt } = await import('bcryptjs');
    const { ROLES } = await import('../config/constants.js');

    const count = await User.countDocuments();
    if (count === 0) {
      const adminPass = await bcrypt.hash('BhumiPatra@Admin2026', 10);
      const opPass = await bcrypt.hash('OperatorPass@2026', 10);
      const officerPass = await bcrypt.hash('OfficerPass@2026', 10);

      await User.create([
        {
          name: 'Super Administrator',
          email: 'admin@bhumipatra.gov.in',
          passwordHash: adminPass,
          role: ROLES.ADMIN,
          department: 'Department of Land Resources & Governance',
          state: 'Uttar Pradesh',
          district: 'Lucknow',
          tehsil: 'Sadar',
          isActive: true,
        },
        {
          name: 'Ramesh Sharma (Operator)',
          email: 'operator@bhumipatra.in',
          passwordHash: opPass,
          role: ROLES.DIGITIZATION_OPERATOR,
          department: 'Land Record Digitization Wing',
          state: 'Uttar Pradesh',
          district: 'Ghaziabad',
          tehsil: 'Loni',
          isActive: true,
        },
        {
          name: 'Vikram Singh (Officer)',
          email: 'officer@bhumipatra.gov.in',
          passwordHash: officerPass,
          role: ROLES.VERIFICATION_OFFICER,
          department: 'Revenue & Cadastral Verification Office',
          state: 'Uttar Pradesh',
          district: 'Ghaziabad',
          tehsil: 'Loni',
          isActive: true,
        },
      ]);
      console.log('[Database] Initial system credentials initialized for Operator, Officer, and Admin.');
    }
  } catch (err) {
    console.warn('[Database Notice] Default user initialization notice:', err.message);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] MongoDB runtime error: ${err.message}`);
});

export default connectDB;
