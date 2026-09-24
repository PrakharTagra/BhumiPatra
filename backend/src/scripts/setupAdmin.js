import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import env from '../config/env.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';

dotenv.config();

async function run() {
  try {
    console.log('[BhumiPatra Setup] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('[BhumiPatra Setup] Connected to MongoDB.');

    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      console.log(`[BhumiPatra Setup] Database already has ${existingCount} user(s). Initial setup is not required.`);
      process.exit(0);
    }

    const adminName = process.env.INITIAL_ADMIN_NAME || 'Super Administrator';
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@bhumipatra.gov.in';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'BhumiPatra@Admin2026';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      passwordHash,
      role: ROLES.ADMIN,
      department: 'Department of Land Resources & Governance',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      tehsil: 'Sadar',
      isActive: true,
    });

    console.log('====================================================');
    console.log(' Initial Administrator Account Created Successfully ');
    console.log('====================================================');
    console.log(` Name:     ${admin.name}`);
    console.log(` Email:    ${admin.email}`);
    console.log(` Password: ${adminPassword}`);
    console.log(` Role:     ${admin.role}`);
    console.log('====================================================');
    console.log('You can now log into the Admin Portal (port 3000) using these credentials.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[BhumiPatra Setup] Setup failed:', error);
    process.exit(1);
  }
}

run();
