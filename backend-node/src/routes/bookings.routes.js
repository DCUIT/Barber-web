  import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { Barber } from '../models/Barber.js';
import { User } from '../models/User.js';

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
  const dayOffMap = barber.dayOff || {};
  const isOff = Boolean(dayOffMap[weekday]);
  const working = isOff ? [] : (barber.workingHours?.[weekday] || []);


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
  try {
    const { role } = req.user;
    const { page = 1, limit = 10, search, barberId, status } = req.query;

    const query = {};
    if (barberId) query.barberId = barberId;
    if (status) query.status = status;

    if (role === 'admin') {
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Nếu có tìm kiếm theo tên khách hàng
      if (search) {
        const users = await User.find({ username: new RegExp(search, 'i') }).select('_id');
        query.userId = { $in: users.map(u => u._id) };
      }

      const totalCount = await Booking.countDocuments(query);
      const bookings = await Booking.find(query)
        .populate('userId', 'username')
        .populate('barberId', 'name')
        .populate('serviceId', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      return res.json({ bookings, totalCount });
    }

    if (role === 'barber') {
      // MVP: assume barber userId === barberId (may be adjusted if you link them differently)
      const mineAsBarber = await Booking.find({ barberId: req.user.id })
        .populate('barberId', 'name')
        .populate('serviceId', 'name price')
        .populate('userId', 'username')
        .sort({ createdAt: -1 });
      return res.json(mineAsBarber);
    }

    const mine = await Booking.find({ userId: req.user.id })
      .populate('barberId', 'name')
      .populate('serviceId', 'name price')
      .sort({ createdAt: -1 });
    res.json(mine);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ msg: 'Server error fetching bookings' });
  }
});

bookingsRouter.get('/stats', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$bookingDate',
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'Completed'] },
                { $ifNull: ['$service.price', 0] },
                0
              ]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const formatted = stats.map(s => ({ name: s._id, revenue: s.revenue || 0, count: s.count || 0 }));
    res.json(formatted);
  } catch (error) {
    console.error('Error getting stats', error);
    res.status(500).json({ msg: 'Lỗi thống kê' });
  }
});


  bookingsRouter.post('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { barberId, serviceId, bookingDate, bookingTime, note } = req.body;
  if (!barberId || !serviceId || !bookingDate || !bookingTime) {
    return res.status(400).json({ msg: 'Missing fields' });
  }

  const today = new Date().toISOString().split('T')[0];
  if (bookingDate < today) {
    return res.status(400).json({ msg: 'Không thể đặt lịch cho ngày trong quá khứ' });
  }

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ msg: 'Service not found' });
    const barber = await Barber.findById(barberId);
    if (!barber) return res.status(404).json({ msg: 'Barber not found' });

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

    // Populated object để Frontend hiển thị ngay lập tức
    const fullBooking = await Booking.findById(booking._id)
      .populate('userId', 'username')
      .populate('serviceId', 'name price')
      .populate('barberId', 'name');

    io.emit('newBooking', fullBooking);

    res.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ msg: 'Server error creating booking' });
  }
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

  bookingsRouter.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      await Booking.findByIdAndDelete(req.params.id);
      res.json({ msg: 'Booking deleted' });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ msg: 'Server error deleting booking' });
    }
  });

  return bookingsRouter;
};
