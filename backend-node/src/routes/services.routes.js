import express from 'express';
import { Service } from '../models/Service.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const servicesRouter = express.Router();

servicesRouter.get('/', async (req, res) => {
  const services = await Service.find({}).sort({ createdAt: -1 });
  res.json(services);
});

servicesRouter.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  const { name, price, durationMinutes, description, image, category } = req.body;
  const service = await Service.create({
    name,
    price,
    durationMinutes,
    description: description || '',
    image: image || '',
    category: category || ''
  });
  res.json(service);
});

servicesRouter.put('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: req.body.name,
        price: req.body.price,
        durationMinutes: req.body.durationMinutes,
        description: req.body.description,
        image: req.body.image,
        category: req.body.category
      }
    },
    { new: true }
  );
  res.json(service);
});

servicesRouter.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ msg: 'deleted' });
});

