import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ msg: 'Missing fields' });

  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ msg: 'Username exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash, role: role || 'user' });

  return res.json({ msg: 'Registered', user: { id: user._id, username: user.username, role: user.role } });
});

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ msg: 'Missing fields' });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ msg: 'Wrong credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ msg: 'Wrong credentials' });

  const token = jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h', subject: String(user._id) }
  );

  return res.json({ access_token: token, username: user.username, role: user.role });
});

// Seed helper: create admin quickly (admin-only)
authRouter.post('/seed-admin', requireAuth, requireRole(['admin']), async (req, res) => {
  const { username = 'admin', password = '123' } = req.body || {};
  const existing = await User.findOne({ username });
  if (existing) return res.json({ msg: 'Admin exists', id: existing._id });
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({ username, passwordHash, role: 'admin' });
  res.json({ msg: 'Seeded', id: admin._id });
});

