const { Router } = require('express');
const auth = require('../middleware/auth');
const { createRide, searchRides, getRideById, testRideCreation, getRideMessages, updateRideStatus, joinRide, respondToJoinRequest, getRideStatus } = require('../controllers/rideController');

const router = Router();

router.post('/rides/create', auth, createRide);
router.get('/rides/search', searchRides);
router.get('/rides/:id', getRideById);
router.get('/rides/:id/messages', auth, getRideMessages);
router.post('/rides/test', auth, testRideCreation);

// Ride status management
router.put('/rides/status', auth, updateRideStatus);
router.post('/rides/join', auth, joinRide);
router.post('/rides/respond-join', auth, respondToJoinRequest);
router.get('/rides/:id/status', auth, getRideStatus);

// Get recent rides for dashboard
router.get('/rides/recent', auth, async (req, res) => {
	try {
		const userId = req.userId;
		const limit = parseInt(req.query.limit) || 10;

		const rides = await Ride.find({
			$or: [
				{ driverId: userId },
				{ 'passengers.userId': userId }
			]
		})
		.populate('driverId', 'name avgRating whatsappNumber')
		.populate('passengers.userId', 'name whatsappNumber')
		.sort({ createdAt: -1 })
		.limit(limit);

		const recentRides = rides.map(ride => ({
			id: ride._id,
			startPoint: ride.startPoint,
			destination: ride.destination,
			date: ride.date,
			time: ride.time,
			status: ride.status || 'pending',
			cost: ride.costPerSeat,
			driver: ride.driverId,
			passengers: ride.passengers,
			isDriver: ride.driverId._id.toString() === userId,
		}));

		res.json(recentRides);
	} catch (error) {
		console.error('Recent rides error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Get ride history
router.get('/rides/history', auth, async (req, res) => {
	try {
		const userId = req.userId;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;
		const skip = (page - 1) * limit;

		const rides = await Ride.find({
			$or: [
				{ driverId: userId },
				{ 'passengers.userId': userId }
			]
		})
		.populate('driverId', 'name avgRating whatsappNumber')
		.populate('passengers.userId', 'name whatsappNumber')
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit);

		const total = await Ride.countDocuments({
			$or: [
				{ driverId: userId },
				{ 'passengers.userId': userId }
			]
		});

		const history = rides.map(ride => ({
			id: ride._id,
			startPoint: ride.startPoint,
			destination: ride.destination,
			date: ride.date,
			time: ride.time,
			status: ride.status || 'pending',
			cost: ride.costPerSeat,
			driver: ride.driverId,
			passengers: ride.passengers,
			isDriver: ride.driverId._id.toString() === userId,
			createdAt: ride.createdAt,
		}));

		res.json({
			rides: history,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('Ride history error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router; 