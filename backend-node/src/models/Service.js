import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 5 },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    category: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', ServiceSchema);

