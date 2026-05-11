  import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { Barber } from '../models/Barber.js';
import { User } from '../models/User.js';
import Notification from '../models/notification.model.js';
import { emitNotification } from '../services/notificationEmitter.js';



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

    // 1. Kiểm tra xem ngày đó Barber có làm việc không (Day off)
    const weekday = new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const isOff = barber.dayOff && barber.dayOff[weekday];
    if (isOff) return res.status(400).json({ msg: 'Barber nghỉ vào ngày này' });

    // 2. Kiểm tra xem giờ đặt có nằm trong giờ làm việc không
    const workingRanges = barber.workingHours?.[weekday] || [];
    const bookingMin = timeToMinutes(bookingTime);
    const isInWorkingHours = workingRanges.some(range => {
      return bookingMin >= timeToMinutes(range.start) && bookingMin < timeToMinutes(range.end);
    });
    if (!isInWorkingHours) return res.status(400).json({ msg: 'Giờ đặt nằm ngoài khung giờ làm việc' });

    // 3. Kiểm tra trùng lịch (Overlap check)
    const conflict = await Booking.findOne({
      barberId,
      bookingDate,
      bookingTime,
      status: { $in: ['Pending', 'Accepted'] }
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

    // Realtime booking (existing)
    io.emit('newBooking', fullBooking);

    // Create DB notifications: admin + selected barber only

    // receiverRole must match user schema enum: user | barber | admin
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIdList = adminUsers.map((u) => u._id);

    const notificationsToEmit = [];

    // Admin notifications (send to all admins found)
    for (const adminId of adminIdList) {
      const notif = await Notification.create({
        receiverId: adminId,
        receiverRole: 'admin',
        title: 'New booking',
        message: `User đặt lịch: ${fullBooking.bookingDate} ${fullBooking.bookingTime}`,
        type: 'booking_created',
        isRead: false,
      });
      notificationsToEmit.push(notif);
    }

    // Selected barber notification
    if (barberId) {
      const barberNotif = await Notification.create({
        receiverId: barberId,
        receiverRole: 'barber',
        title: 'New booking',
        message: `Bạn có lịch mới: ${fullBooking.bookingDate} ${fullBooking.bookingTime}`,
        type: 'booking_created',
        isRead: false,
      });
      notificationsToEmit.push(barberNotif);
    }

    // Emit notification realtime
    notificationsToEmit.forEach((n) => emitNotification(io, n));


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

    // Emit booking updated event (existing realtime refresh)
    io.emit('bookingUpdated', booking);

    // Create DB notification for user on Accepted/Completed/Cancelled
    const shouldNotifyUser = ['Accepted', 'Completed', 'Cancelled'].includes(status);
    if (shouldNotifyUser) {
      const fullBooking = await Booking.findById(booking._id)
        .populate('userId', '_id')
        .populate('barberId', '_id');

      const userId = fullBooking.userId?._id;
      if (userId) {
        const notif = await Notification.create({
          receiverId: userId,
          receiverRole: 'user',
          title: 'Booking update',
          message: `Booking ${status.toLowerCase()}.`,
          type: 'booking_status',
          isRead: false,
        });
        io.emit('notification:new', notif);
      }
    }

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
