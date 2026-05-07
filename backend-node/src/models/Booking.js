import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    barberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },

    bookingDate: { type: String, required: true }, // YYYY-MM-DD
    bookingTime: { type: String, required: true }, // HH:mm (start)

    note: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Accepted', 'Completed', 'Cancelled'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

export const Booking = mongoose.model('Booking', BookingSchema);

