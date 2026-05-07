import express from 'express';
import { Barber } from '../models/Barber.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const barbersRouter = express.Router();

barbersRouter.get('/', async (req, res) => {
  const barbers = await Barber.find({}).sort({ createdAt: -1 });
  res.json(barbers);
});

barbersRouter.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  const { name, avatar, experienceYears, specialty, workingHours, rating } = req.body;
  const barber = await Barber.create({
    name,
    avatar: avatar || '',
    experienceYears: experienceYears || 0,
    specialty: specialty || '',
    workingHours: workingHours || {},
    rating: rating || 0
  });
  res.json(barber);
});

barbersRouter.put('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const barber = await Barber.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: req.body.name,
        avatar: req.body.avatar,
        experienceYears: req.body.experienceYears,
        specialty: req.body.specialty,
        workingHours: req.body.workingHours,
        rating: req.body.rating
      }
    },
    { new: true }
  );
  res.json(barber);
});

barbersRouter.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  await Barber.findByIdAndDelete(req.params.id);
  res.json({ msg: 'deleted' });
});

