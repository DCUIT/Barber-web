import mongoose from 'mongoose';

const BarberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    experienceYears: { type: Number, default: 0, min: 0 },
    specialty: { type: String, default: '' },
    // workingHours: { mon: [{start:"09:00", end:"17:00"}], ... }
    workingHours: {
      type: Object,
      default: {}
    },

    // dayOff: { mon: true/false, tue: true/false, ... }
    dayOff: {
      type: Object,
      default: {
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false,
        sun: false
      }
    },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Barber = mongoose.model('Barber', BarberSchema);
