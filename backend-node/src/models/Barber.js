import mongoose from 'mongoose';

const BarberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    experienceYears: { type: Number, default: 0, min: 0 },
    specialty: { type: String, default: '' },
    workingHours: {
      // Example: { "mon": [{"start":"09:00","end":"17:00"}], ... }
      type: Object,
      default: {}
    },
    rating: { type: Number, default: 0, min: 0, max: 5 }
  },
  { timestamps: true }
);

export const Barber = mongoose.model('Barber', BarberSchema);

