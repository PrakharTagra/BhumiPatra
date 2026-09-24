import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return password hashes in normal queries
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: Object.values(ROLES),
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'Land Records & Revenue Department',
    },
    state: {
      type: String,
      trim: true,
      default: null,
    },
    district: {
      type: String,
      trim: true,
      default: null,
    },
    tehsil: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, district: 1 });

// Helper to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Transform to remove sensitive fields when serialized to JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
export default User;
