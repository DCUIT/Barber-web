import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { findBarberForUser } from '../services/barberResolver.js';

const router = express.Router();

const workingDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function minutesToTime(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
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

// availability for week (slots count per day)
router.get('/availability', requireAuth, requireRole(['barber']), async (req, res) => {
  try {
    const start = req.query.start;
    if (!start) return res.status(400).json({ msg: 'Missing start' });

    const barber = await findBarberForUser(req.user.id);
    if (!barber) return res.status(404).json({ msg: 'Barber not found' });

    const dayOffMap = barber.dayOff || {};
    const workingHours = barber.workingHours || {};

    const dates = getWeekDates(start);
    const days = dates.map((date) => {
      const weekday = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      const isOff = Boolean(dayOffMap[weekday]);
      const ranges = isOff ? [] : (workingHours?.[weekday] || []);

      const slots = [];
      for (const range of ranges) {
        const startMin = timeToMinutes(range.start);
        const endMin = timeToMinutes(range.end);
        for (let t = startMin; t < endMin; t += 30) {
          slots.push(minutesToTime(t));
        }
      }

      return { date, weekday, slots };
    });

    res.json({ days });
  } catch (e) {
    res.status(500).json({ msg: 'Server error' });
  }
});

export const barberAvailabilityRouter = router;

