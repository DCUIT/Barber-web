import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { Barber } from '../models/Barber.js';

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Export a function that returns the router, accepting io as an argument
export const createBookingsRouter = (io) => {
  const bookingsRouter = express.Router();

bookingsRouter.get('/calendar', requireAuth, async (req, res) => {
  const { barberId, date } = req.query;
  if (!barberId || !date) return res.status(400).json({ msg: 'Missing barberId/date' });

  // Simple: generate 30-minute slots between workingHours for weekday
  const barber = await Barber.findById(barberId);
  if (!barber) return res.status(404).json({ msg: 'Barber not found' });

  const weekday = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const working = barber.workingHours?.[weekday] || [];

  const booked = await Booking.find({ barberId, bookingDate: date, status: { $in: ['Pending','Accepted'] } });
  const bookedTimes = new Set(booked.map(b => b.bookingTime));

  const slots = [];
  for (const range of working) {
    const start = timeToMinutes(range.start);
    const end = timeToMinutes(range.end);
    for (let t = start; t < end; t += 30) {
      const slot = minutesToTime(t);
      if (!bookedTimes.has(slot)) slots.push(slot);
    }
  }

  res.json({ barberId, date, slots });
});

bookingsRouter.get('/', requireAuth, async (req, res) => {
  const { role } = req.user;
  if (role === 'admin') {
    const all = await Booking.find({}).sort({ createdAt: -1 });
    return res.json(all);
  }

  const mine = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(mine);
});

  bookingsRouter.post('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { barberId, serviceId, bookingDate, bookingTime, note } = req.body;
  if (!barberId || !serviceId || !bookingDate || !bookingTime) {
    return res.status(400).json({ msg: 'Missing fields' });
  }

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ msg: 'Service not found' });

  // Simple overlap rule: block exact start time (keeps logic simple for internship MVP)
  const conflict = await Booking.findOne({
    barberId,
    bookingDate,
    bookingTime,
    status: { $in: ['Pending','Accepted'] }
  });

  if (conflict) return res.status(409).json({ msg: 'Time slot already booked' });

  const booking = await Booking.create({
    userId,
    barberId,
    serviceId,
    bookingDate,
    bookingTime,
    note: note || '',
    status: 'Pending'
  });

    // Emit new booking event
    io.emit('newBooking', booking); // Emit to all connected clients

  res.json(booking);
});

  bookingsRouter.put('/:id/status', requireAuth, requireRole(['admin','barber']), async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ msg: 'Not found' });

  // barber can update status in a real app with permission checks; MVP allows admin/barber
  const { status } = req.body;
  const valid = ['Pending','Accepted','Completed','Cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ msg: 'Invalid status' });

  booking.status = status;
  await booking.save();

    // Emit booking updated event
    io.emit('bookingUpdated', booking); // Emit to all connected clients

  res.json(booking);
});

  return bookingsRouter;
};
