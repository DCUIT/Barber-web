import { Barber } from '../models/Barber.js';
import { User } from '../models/User.js';

export async function findBarberForUser(userId) {
  if (!userId) return null;

  const linked = await Barber.findOne({ userId });
  if (linked) return linked;

  const user = await User.findById(userId).select('username');
  if (!user?.username) return null;

  const byName = await Barber.findOne({
    name: new RegExp(`^${escapeRegExp(user.username)}$`, 'i'),
  });

  if (byName && !byName.userId) {
    byName.userId = userId;
    await byName.save();
  }

  return byName;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
