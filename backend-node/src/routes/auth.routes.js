import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
  const { name, username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ msg: 'Missing fields' });

  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ msg: 'Username exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name || username, username, passwordHash, role: role || 'user' });

  return res.json({ msg: 'Registered', user: { id: user._id, name: user.name, username: user.username, role: user.role } });
});

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ msg: 'Missing fields' });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ msg: 'Wrong credentials' });
  if (user.isBlocked) return res.status(403).json({ msg: 'Account is blocked' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ msg: 'Wrong credentials' });

  const token = jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h', subject: String(user._id) }
  );

  return res.json({ access_token: token, name: user.name || user.username, username: user.username, role: user.role });
});

// Get all users (Admin only)
authRouter.get('/users', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update user role (Admin only)
authRouter.put('/users/:id/role', requireAuth, requireRole(['admin']), async (req, res) => {
  const { role } = req.body;
  await User.findByIdAndUpdate(req.params.id, { role });
  res.json({ msg: 'Role updated' });
});

// Toggle Block user (Admin only)
authRouter.put('/users/:id/block', requireAuth, requireRole(['admin']), async (req, res) => {
  const { isBlocked } = req.body;
  await User.findByIdAndUpdate(req.params.id, { isBlocked });
  res.json({ msg: isBlocked ? 'User blocked' : 'User unblocked' });
});

// Delete user (Admin only)
authRouter.delete('/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ msg: 'User deleted' });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json({ name: user.name || user.username, username: user.username, avatar: user.avatar || '', phone: user.phone || '', role: user.role });
  } catch (e) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

authRouter.put('/me', requireAuth, async (req, res) => {
  const { name, avatar, phone } = req.body || {};
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.name = typeof name === 'string' && name.trim() ? name.trim() : user.name;
    user.avatar = typeof avatar === 'string' ? avatar : user.avatar;
    user.phone = typeof phone === 'string' ? phone : user.phone;
    await user.save();

    return res.json({ msg: 'Profile updated', user: { name: user.name || user.username, username: user.username, avatar: user.avatar || '', phone: user.phone || '' } });
  } catch (e) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

authRouter.put('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ msg: 'Missing fields' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ msg: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    return res.json({ msg: 'Password changed' });
  } catch (e) {
    return res.status(500).json({ msg: 'Server error' });
  }
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
