import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongo() {
  if (process.env.DB_DRIVER === 'sqlite') return;
  if (isConnected) return;

  const uri =
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/barber_booking_web';

  await mongoose.connect(uri);

  isConnected = true;

  console.log('MongoDB connected');
}