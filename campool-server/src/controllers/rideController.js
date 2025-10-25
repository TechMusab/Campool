const Ride = require('../models/Ride');
const User = require('../models/User');

function isFutureDate(dateString, timeString) {
	try {
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return false;
		let dt = date;
		if (timeString) {
			const [hh = '0', mm = '0'] = String(timeString).split(':');
			dt.setHours(Number(hh), Number(mm), 0, 0);
		}
		return dt.getTime() > Date.now();
	} catch {
		return false;
	}
}

async function createRide(req, res) {
	try {
		console.log('createRide called with body:', req.body);
		console.log('createRide called with userId:', req.userId);
		
		
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for ride creation...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for ride creation');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const { startPoint, destination, date, time, seats, costPerSeat, distanceKm } = req.body || {};
		console.log('Parsed data:', { startPoint, destination, date, time, seats, costPerSeat, distanceKm });
		
		if (!startPoint || !destination || !date || !time) {
			console.log('Missing required fields');
			return res.status(400).json({ error: 'startPoint, destination, date and time are required' });
		}
		const isFuture = isFutureDate(date, time);
		console.log('Date validation result:', isFuture, 'for date:', date, 'time:', time);
		if (!isFuture) {
			console.log('Date is not in the future');
			return res.status(400).json({ error: 'Date/time must be in the future' });
		}
		const seatsNum = Number(seats);
		const costNum = Number(costPerSeat);
		const distanceNum = Number(distanceKm);
		console.log('Parsed numbers:', { seatsNum, costNum, distanceNum });
		
		if (!(seatsNum > 0)) return res.status(400).json({ error: 'Seats must be > 0' });
		if (!(costNum > 0)) return res.status(400).json({ error: 'Cost per seat must be > 0' });
		if (!(distanceNum > 0)) return res.status(400).json({ error: 'distanceKm must be > 0' });

		console.log('Creating ride with data:', {
			driverId: req.userId,
			startPoint,
			destination,
			date: new Date(date),
			time,
			availableSeats: seatsNum,
			costPerSeat: costNum,
			distanceKm: distanceNum,
		});

		const ride = await Ride.create({
			driverId: req.userId,
			startPoint,
			destination,
			date: new Date(date),
			time,
			availableSeats: seatsNum,
			costPerSeat: costNum,
			distanceKm: distanceNum,
		});

		console.log('Ride created successfully:', ride._id);

		const populated = await ride.populate({ path: 'driverId', select: 'name avgRating whatsappNumber' });
		return res.status(201).json({ success: true, ride: populated });
	} catch (err) {
		console.error('createRide error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function searchRides(req, res) {
	try {
		const { startPoint = '', destination = '', datetime, page = 1, limit = 10 } = req.query || {};
		const pageNum = Math.max(1, Number(page));
		const limitNum = Math.min(50, Math.max(1, Number(limit)));

		const query = {};
		const or = [];
		if (startPoint) or.push({ startPoint: { $regex: String(startPoint), $options: 'i' } });
		if (destination) or.push({ destination: { $regex: String(destination), $options: 'i' } });
		if (or.length) query.$or = or;

		if (datetime) {
			const after = new Date(String(datetime));
			if (!Number.isNaN(after.getTime())) {
				query.date = { $gte: after };
			}
		} else {
			query.date = { $gte: new Date() };
		}

		const rides = await Ride.find(query)
			.sort({ date: 1 })
			.skip((pageNum - 1) * limitNum)
			.limit(limitNum)
			.populate({ path: 'driverId', select: 'name avgRating whatsappNumber' })
			.lean();

		const items = rides.map((r) => {
			const totalCost = (r.costPerSeat || 0) * (r.availableSeats || 0);
			const numPassengers = Array.isArray(r.passengers) ? r.passengers.length : 0;
			const perPassengerCost = numPassengers > 0 ? totalCost / numPassengers : r.costPerSeat;
			return { ...r, totalCost, perPassengerCost };
		});

		const total = await Ride.countDocuments(query);
		return res.json({ items, page: pageNum, limit: limitNum, total });
	} catch (err) {
		console.error('searchRides error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function getRideById(req, res) {
	try {
		const { id } = req.params;
		const ride = await Ride.findById(id).populate({ path: 'driverId', select: 'name avgRating whatsappNumber' }).lean();
		if (!ride) return res.status(404).json({ error: 'Ride not found' });
		const totalCost = (ride.costPerSeat || 0) * (ride.availableSeats || 0);
		const numPassengers = Array.isArray(ride.passengers) ? ride.passengers.length : 0;
		const perPassengerCost = numPassengers > 0 ? totalCost / numPassengers : ride.costPerSeat;
		return res.json({ ...ride, totalCost, perPassengerCost });
	} catch (err) {
		console.error('getRideById error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// Test ride creation endpoint
async function testRideCreation(req, res) {
	try {
		console.log('Test ride creation called');
		
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for test ride creation...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for test ride creation');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		// Create a test ride with fixed data
		const testRide = await Ride.create({
			driverId: req.userId || '68fd20df9a4a98742d7322e0', // Alice's ID
			startPoint: 'Test Start',
			destination: 'Test Destination',
			date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
			time: '10:00',
			availableSeats: 2,
			costPerSeat: 50,
			distanceKm: 10,
		});

		console.log('Test ride created successfully:', testRide._id);
		return res.status(201).json({ success: true, ride: testRide });
	} catch (err) {
		console.error('Test ride creation error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
}

// Get messages for a ride
async function getRideMessages(req, res) {
	try {
		console.log('getRideMessages called for ride:', req.params.id);
		
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for ride messages...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for ride messages');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const Message = require('../models/Message');
		const Ride = require('../models/Ride');

		const rideId = req.params.id;
		if (!mongoose.isValidObjectId(rideId)) {
			return res.status(400).json({ error: 'Invalid ride ID' });
		}

		// Verify ride exists
		const ride = await Ride.findById(rideId);
		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		// Get messages for this ride
		const messages = await Message.find({ rideId })
			.sort({ createdAt: 1 })
			.lean();

		console.log('Found messages:', messages.length);
		return res.json(messages);
	} catch (err) {
		console.error('getRideMessages error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
}


// Update ride status (for drivers)
async function updateRideStatus(req, res) {
	try {
		console.log('updateRideStatus called:', req.body);
		
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for ride status update...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for ride status update');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const { rideId, status } = req.body;
		if (!rideId || !status) {
			return res.status(400).json({ error: 'rideId and status are required' });
		}

		// Verify ride exists and user is the driver
		const ride = await Ride.findById(rideId);
		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		if (ride.driverId.toString() !== req.userId) {
			return res.status(403).json({ error: 'Only the driver can update ride status' });
		}

		// Update status with timestamps
		const updateData = { status };
		if (status === 'started') {
			updateData.startedAt = new Date();
			updateData.actualStartTime = new Date();
		} else if (status === 'completed') {
			updateData.completedAt = new Date();
			updateData.actualEndTime = new Date();
		}

		const updatedRide = await Ride.findByIdAndUpdate(
			rideId,
			updateData,
			{ new: true }
		).populate('driverId', 'name whatsappNumber');

		console.log('Ride status updated successfully:', updatedRide._id);
		return res.json({ success: true, ride: updatedRide });
	} catch (err) {
		console.error('updateRideStatus error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
}

// Join a ride (for passengers)
async function joinRide(req, res) {
	try {
		console.log('joinRide called:', req.body);
		
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for join ride...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for join ride');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const { rideId } = req.body;
		if (!rideId) {
			return res.status(400).json({ error: 'rideId is required' });
		}

		// Verify ride exists
		const ride = await Ride.findById(rideId);
		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		// Check if user is already a passenger
		const existingPassenger = ride.passengers.find(p => p.userId.toString() === req.userId);
		if (existingPassenger) {
			return res.status(400).json({ error: 'You have already joined this ride' });
		}

		// Check if there are available seats
		if (ride.passengers.length >= ride.availableSeats) {
			return res.status(400).json({ error: 'No available seats' });
		}

		// Add passenger to ride
		ride.passengers.push({
			userId: req.userId,
			joinedAt: new Date(),
			status: 'joined'
		});

		// Update ride status to confirmed if it was pending
		if (ride.status === 'pending') {
			ride.status = 'confirmed';
		}

		await ride.save();

		const populatedRide = await Ride.findById(ride._id)
			.populate('driverId', 'name whatsappNumber')
			.populate('passengers.userId', 'name whatsappNumber');

		console.log('User joined ride successfully:', ride._id);
		return res.json({ success: true, ride: populatedRide });
	} catch (err) {
		console.error('joinRide error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
}

// Get ride status for tracking
async function getRideStatus(req, res) {
	try {
		console.log('getRideStatus called for ride:', req.params.id);
		
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for ride status...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for ride status');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const rideId = req.params.id;
		if (!mongoose.isValidObjectId(rideId)) {
			return res.status(400).json({ error: 'Invalid ride ID' });
		}

		const ride = await Ride.findById(rideId)
			.populate('driverId', 'name whatsappNumber')
			.populate('passengers.userId', 'name whatsappNumber');

		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		// Check if user is driver or passenger
		const isDriver = ride.driverId._id.toString() === req.userId;
		const isPassenger = ride.passengers.some(p => p.userId._id.toString() === req.userId);

		if (!isDriver && !isPassenger) {
			return res.status(403).json({ error: 'You are not part of this ride' });
		}

		console.log('Ride status retrieved:', ride.status);
		return res.json({ 
			success: true, 
			ride: {
				id: ride._id,
				status: ride.status,
				startedAt: ride.startedAt,
				completedAt: ride.completedAt,
				actualStartTime: ride.actualStartTime,
				actualEndTime: ride.actualEndTime,
				driver: ride.driverId,
				passengers: ride.passengers,
				startPoint: ride.startPoint,
				destination: ride.destination,
				date: ride.date,
				time: ride.time
			}
		});
	} catch (err) {
		console.error('getRideStatus error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
}

module.exports = { createRide, searchRides, getRideById, testRideCreation, getRideMessages, updateRideStatus, joinRide, getRideStatus }; 