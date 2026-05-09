import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';
import { Barber } from '../models/Barber.js';

const router = express.Router();

function getDaySlotsForRange(startMin, endMin) {
  const slots = [];
  for (let t = startMin; t < endMin; t += 30) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getWeekDates(startDate) {
  const base = new Date(startDate + 'T00:00:00');
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
}

// helper to compute free slots for today
async function computeTodayAvailability({ barberId, date }) {
  const barber = await Barber.findById(barberId);
  if (!barber) return { slots: [] };

  const weekday = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const isOff = Boolean((barber.dayOff || {})[weekday]);
  const working = isOff ? [] : (barber.workingHours?.[weekday] || []);

  const booked = await Booking.find({
    barberId,
    bookingDate: date,
    status: { $in: ['Pending', 'Accepted'] },
  });
  const bookedTimes = new Set(booked.map((b) => b.bookingTime));

  const slots = [];
  for (const range of working) {
    const startMin = timeToMinutes(range.start);
    const endMin = timeToMinutes(range.end);
    for (const slot of getDaySlotsForRange(startMin, endMin)) {
      if (!bookedTimes.has(slot)) slots.push(slot);
    }
  }

  return { slots };
}

// Today bookings for barber
router.get('/bookings/today', requireAuth, requireRole(['barber']), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Missing date' });

    const barberId = req.user.id;

    const bookings = await Booking.find({
      barberId,
      bookingDate: date,
    })
      .populate('userId', 'username')
      .populate('serviceId', 'name price')
      .populate('barberId', 'name');

    return res.json({ bookings });
  } catch (e) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

// Week bookings for barber
router.get('/bookings/week', requireAuth, requireRole(['barber']), async (req, res) => {
  try {
    const { start } = req.query;
    if (!start) return res.status(400).json({ msg: 'Missing start' });

    const barberId = req.user.id;
    const weekDates = getWeekDates(start);

    const bookings = await Booking.find({
      barberId,
      bookingDate: { $in: weekDates },
    })
      .populate('userId', 'username')
      .populate('serviceId', 'name price')
      .populate('barberId', 'name')
      .sort({ createdAt: 1 });

    const map = {};
    for (const d of weekDates) map[d] = [];
    for (const b of bookings) {
      if (!map[b.bookingDate]) map[b.bookingDate] = [];
      map[b.bookingDate].push(b);
    }

    const days = weekDates.map((d) => ({ date: d, bookings: map[d] || [] }));
    return res.json({ days });
  } catch (e) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

export const barberBookingsRouter = router;

