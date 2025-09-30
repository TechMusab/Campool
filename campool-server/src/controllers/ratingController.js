const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const Ride = require('../models/Ride');
const User = require('../models/User');

async function addRating(req, res) {
	try {
		const { rideId, driverId, rating, review } = req.body || {};
		if (!mongoose.isValidObjectId(rideId) || !mongoose.isValidObjectId(driverId)) {
			return res.status(400).json({ error: 'Invalid rideId or driverId' });
		}
		const r = Number(rating);
		if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
		if (review && String(review).length > 300) return res.status(400).json({ error: 'Review too long (max 300 chars)' });

		const ride = await Ride.findById(rideId).lean();
		if (!ride) return res.status(404).json({ error: 'Ride not found' });

		// Prevent duplicate rating per passenger per ride (unique index also enforces it)
		const exists = await Rating.findOne({ rideId, passengerId: req.userId }).lean();
		if (exists) return res.status(409).json({ error: 'You have already rated this ride' });

		const ratingDoc = await Rating.create({ rideId, driverId, passengerId: req.userId, rating: r, review });

		// Recalculate driver averages
		const agg = await Rating.aggregate([
			{ $match: { driverId: new mongoose.Types.ObjectId(driverId) } },
			{ $group: { _id: '$driverId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
		]);
		const avg = agg[0]?.avg || 0;
		const count = agg[0]?.count || 0;
		await User.findByIdAndUpdate(driverId, { $set: { avgRating: avg, totalRatings: count } });

		return res.status(201).json({ message: 'Rating saved', newAverage: avg, rating: ratingDoc });
	} catch (err) {
		if (err?.code === 11000) return res.status(409).json({ error: 'You have already rated this ride' });
		console.error('addRating error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function getDriverRatings(req, res) {
	try {
		const { driverId } = req.params;
		const { page = '1', limit = '10' } = req.query;
		if (!mongoose.isValidObjectId(driverId)) return res.status(400).json({ error: 'Invalid driverId' });
		const pageNum = Math.max(1, Number(page));
		const limitNum = Math.min(50, Math.max(1, Number(limit)));

		const driver = await User.findById(driverId).select('name avgRating totalRatings').lean();
		if (!driver) return res.status(404).json({ error: 'Driver not found' });

		const ratings = await Rating.find({ driverId })
			.sort({ createdAt: -1 })
			.skip((pageNum - 1) * limitNum)
			.limit(limitNum)
			.populate({ path: 'passengerId', select: 'name' })
			.lean();
		const total = await Rating.countDocuments({ driverId });
		return res.json({ driver, items: ratings, page: pageNum, limit: limitNum, total });
	} catch (err) {
		console.error('getDriverRatings error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = { addRating, getDriverRatings }; 