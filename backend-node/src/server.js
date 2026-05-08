import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes.js';
import { servicesRouter } from './routes/services.routes.js';
import { uploadRouter } from './routes/upload.routes.js';
import { barbersRouter } from './routes/barbers.routes.js';
import { bookingsRouter } from './routes/bookings.routes.js';
import { seedDatabase } from './routes/seed.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.json({ ok: true, service: 'barber-booking-api' });
});

app.use('/auth', authRouter);
app.use('/services', servicesRouter);
app.use('/barbers', barbersRouter);
app.use('/upload', uploadRouter); // Thêm route upload ảnh
app.use('/bookings', bookingsRouter);

const PORT = process.env.PORT || 4000;

// allow running like: node src/server.js --driver=sqlite
const argvDriver = process.argv.find(a => a.startsWith('--driver='))?.split('=')[1];
const driverRaw = argvDriver ?? process.env.DB_DRIVER;
const driver = (driverRaw || 'mongo').toLowerCase();

console.log('DB_DRIVER raw=', process.env.DB_DRIVER, ' argvDriver=', argvDriver, ' driver=', driver);


if (driver === 'sqlite') {
  // SQLite MVP: only init sqlite schema + seed using sqlite logic
  await seedDatabase();
} else {
  // MongoDB mode
  const { connectMongo } = await import('./services/db.js');
  await connectMongo();
  await seedDatabase();
}


app.listen(PORT, () => {
  console.log(`Node API running on http://localhost:${PORT} (driver=${driver})`);
});
