import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['user', 'barber', 'admin'],
      default: 'user'
    },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);
