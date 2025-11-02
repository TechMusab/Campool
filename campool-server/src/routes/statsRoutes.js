const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Ride = require('../models/Ride');

const router = Router();

router.get('/stats/:userId', auth, async (req, res) => {
	try {
		const { userId } = req.params;
		if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid userId' });

        const ridesOffered = await Ride.countDocuments({ driverId: userId });
        const ridesTaken = await Ride.countDocuments({ 'passengers.userId': userId });

        // Money saved: naive estimate: (distanceKm * costPerSeat?) or sum of per-seat costs user didn't pay alone.
        // Here: sum of costPerSeat for rides taken
        const takenAgg = await Ride.aggregate([
            { $match: { 'passengers.userId': new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, sum: { $sum: '$costPerSeat' } } },
        ]);
        const moneySaved = takenAgg[0]?.sum || 0;

        // CO2 saved: sum over rides: distanceKm * 0.12 * (passengersJoined - 1)
        const co2Agg = await Ride.aggregate([
            { $match: { $or: [ { driverId: new mongoose.Types.ObjectId(userId) }, { 'passengers.userId': new mongoose.Types.ObjectId(userId) } ] } },
            { $project: { distanceKm: 1, passengersCount: { $size: { $ifNull: ['$passengers', []] } } } },
            { $project: { saved: { $multiply: ['$distanceKm', 0.12, { $max: [0, { $subtract: ['$passengersCount', 1] }] }] } } },
            { $group: { _id: null, total: { $sum: '$saved' } } },
        ]);
        const co2SavedKg = Number(co2Agg[0]?.total || 0);

		return res.json({ userId, ridesTaken, ridesOffered, moneySaved, co2SavedKg });
	} catch (err) {
		console.error('GET /stats/:userId error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router; 