import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { Barber } from '../models/Barber.js';
import { User } from '../models/User.js';

export const reviewsRouter = express.Router();

// POST /reviews
// Body: { bookingId, rating, comment }
// Rules:
// - booking must exist and belong to req.user
// - booking.status must be Completed
// - booking can only be reviewed once (bookingId unique)
// - after insert: update barber.rating = avg(review.rating)
reviewsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body || {};

    if (!bookingId || !rating) return res.status(400).json({ msg: 'Missing bookingId/rating' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (String(booking.userId) !== String(req.user.id)) return res.status(403).json({ msg: 'Forbidden' });
    if (booking.status !== 'Completed') return res.status(400).json({ msg: 'Chỉ được đánh giá khi booking Completed' });

    const existing = await Review.findOne({ bookingId });
    if (existing) return res.status(409).json({ msg: 'Booking này đã được đánh giá' });

    const cleanRating = Number(rating);
    if (Number.isNaN(cleanRating) || cleanRating < 1 || cleanRating > 5) {
      return res.status(400).json({ msg: 'rating phải từ 1 đến 5' });
    }

    const review = await Review.create({
      userId: req.user.id,
      barberId: booking.barberId,
      bookingId,
      rating: cleanRating,
      comment: comment || '',
    });

    // Update barber avg rating
    const agg = await Review.aggregate([
      { $match: { barberId: booking.barberId } },
      { $group: { _id: '$barberId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const avgRating = agg[0]?.avgRating ?? 0;
    await Barber.findByIdAndUpdate(booking.barberId, { rating: avgRating });

    return res.json({ msg: 'Review created', review });
  } catch (e) {
    console.error('Create review error:', e);
    return res.status(500).json({ msg: 'Server error creating review' });
  }
});

// GET /reviews/barbers/:barberId
reviewsRouter.get('/barbers/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    const reviews = await Review.find({ barberId })
      .populate('userId', 'username avatar')
      .populate('bookingId', 'bookingDate bookingTime status')
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (e) {
    console.error('Fetch reviews error:', e);
    return res.status(500).json({ msg: 'Server error fetching reviews' });
  }
});

