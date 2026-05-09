import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Barber } from '../models/Barber.js';

const router = express.Router();

const workingDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function normalizeWorkingHours(workingHours) {
  return workingHours && typeof workingHours === 'object' ? workingHours : {};
}

function normalizeDayOff(dayOff) {
  const base = {
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
    sun: false,
  };
  if (!dayOff || typeof dayOff !== 'object') return base;

  const out = { ...base };
  for (const k of workingDayKeys) {
    if (typeof dayOff[k] === 'boolean') out[k] = dayOff[k];
  }
  return out;
}

router.get('/me', requireAuth, requireRole(['barber']), async (req, res) => {
  const barber = await Barber.findById(req.user.id);
  if (!barber) return res.status(404).json({ msg: 'Barber not found' });

  res.json({
    name: barber.name,
    avatar: barber.avatar || '',
    experienceYears: barber.experienceYears || 0,
    specialty: barber.specialty || '',
    workingHours: barber.workingHours || {},
    dayOff: barber.dayOff || {},
  });
});

router.put('/me', requireAuth, requireRole(['barber']), async (req, res) => {
  const barber = await Barber.findById(req.user.id);
  if (!barber) return res.status(404).json({ msg: 'Barber not found' });

  const { avatar, experienceYears, specialty, workingHours, dayOff } = req.body || {};

  if (typeof avatar === 'string') barber.avatar = avatar;
  if (specialty !== undefined) barber.specialty = typeof specialty === 'string' ? specialty : barber.specialty;
  if (experienceYears !== undefined) {
    const v = Number(experienceYears);
    if (!Number.isNaN(v)) barber.experienceYears = Math.max(0, v);
  }

  if (workingHours !== undefined) barber.workingHours = normalizeWorkingHours(workingHours);
  if (dayOff !== undefined) barber.dayOff = normalizeDayOff(dayOff);

  await barber.save();

  res.json({
    msg: 'Barber profile/availability updated',
    barber: {
      name: barber.name,
      avatar: barber.avatar || '',
      experienceYears: barber.experienceYears || 0,
      specialty: barber.specialty || '',
      workingHours: barber.workingHours || {},
      dayOff: barber.dayOff || {},
    },
  });
});

export const barberRouter = router;

