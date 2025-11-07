const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Get user profile
async function getProfile(req, res) {
	try {
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for profile...');
			try {
			await mongoose.connect(MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for profile');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const userId = req.userId; // From auth middleware
		const user = await User.findById(userId).select('-passwordHash');
		
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Calculate stats
		const totalRides = user.ridesAsDriver?.length || 0;
		const completedRides = user.ridesAsDriver?.filter(ride => ride.status === 'completed').length || 0;
		const avgRating = user.avgRating || 0;

		res.json({
			id: user._id,
			name: user.name,
			email: user.email,
			studentId: user.studentId,
			whatsappNumber: user.whatsappNumber,
			isVerified: user.isVerified,
			avgRating: avgRating,
			totalRides: totalRides,
			completedRides: completedRides
		});
	} catch (error) {
		console.error('Get profile error', error);
		res.status(500).json({ error: 'Internal server error' });
	}
}

// Update user profile
async function updateProfile(req, res) {
	try {
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for profile update...');
			try {
			await mongoose.connect(MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for profile update');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const userId = req.userId; // From auth middleware
		const { name, whatsappNumber } = req.body;

		const user = await User.findByIdAndUpdate(
			userId,
			{ 
				name: name || undefined,
				whatsappNumber: whatsappNumber || undefined
			},
			{ new: true }
		).select('-passwordHash');

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json({
			id: user._id,
			name: user.name,
			email: user.email,
			studentId: user.studentId,
			whatsappNumber: user.whatsappNumber,
			isVerified: user.isVerified
		});
	} catch (error) {
		console.error('Update profile error', error);
		res.status(500).json({ error: 'Internal server error' });
	}
}

// Get user's chat conversations (inbox)
async function getInbox(req, res) {
	try {
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for inbox...');
			try {
			await mongoose.connect(MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for inbox');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const userId = req.userId; // From auth middleware
		const Message = require('../models/Message');
		const Ride = require('../models/Ride');
		const User = require('../models/User');

		// Get all messages where user is either sender or receiver
		const messages = await Message.find({
			$or: [
				{ senderId: userId },
				{ 'rideId.driverId': userId }
			]
		})
		.populate('rideId', 'startPoint destination driverId')
		.sort({ createdAt: -1 })
		.limit(100);

		// Group messages by rideId
		const conversations = new Map();
		
		for (const message of messages) {
			const rideId = message.rideId._id.toString();
			const ride = message.rideId;
			
			if (!conversations.has(rideId)) {
				// Get the other participant
				let otherParticipant = null;
				if (ride.driverId.toString() === userId) {
					// User is driver, get passenger info from message
					otherParticipant = {
						name: message.senderName,
						id: message.senderId
					};
				} else {
					// User is passenger, get driver info
					const driver = await User.findById(ride.driverId).select('name').lean();
					otherParticipant = {
						name: driver?.name || 'Driver',
						id: ride.driverId.toString()
					};
				}

				conversations.set(rideId, {
					id: rideId,
					rideId: rideId,
					rideTitle: `${ride.startPoint} → ${ride.destination}`,
					lastMessage: message.text,
					lastMessageTime: message.createdAt,
					unreadCount: 0, // TODO: Implement unread count
					otherParticipant: otherParticipant
				});
			} else {
				// Update with latest message if this is newer
				const existing = conversations.get(rideId);
				if (message.createdAt > existing.lastMessageTime) {
					existing.lastMessage = message.text;
					existing.lastMessageTime = message.createdAt;
				}
			}
		}

		// Convert to array and sort by last message time
		const inbox = Array.from(conversations.values())
			.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

		res.json(inbox);
	} catch (error) {
		console.error('Get inbox error', error);
		res.status(500).json({ error: 'Internal server error' });
	}
}

// Test message creation endpoint
async function testMessage(req, res) {
	try {
		console.log('Test message creation called');
		
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for test message...');
			try {
			await mongoose.connect(MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for test message');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const Message = require('../models/Message');
		const Ride = require('../models/Ride');
		const User = require('../models/User');

		// Get a test ride or create one
		let testRide = await Ride.findOne().lean();
		if (!testRide) {
			// Create a test ride
			const testUser = await User.findOne().lean();
			if (!testUser) {
				return res.status(400).json({ error: 'No users found' });
			}
			testRide = await Ride.create({
				driverId: testUser._id,
				startPoint: 'Test Start',
				destination: 'Test Destination',
				date: new Date(Date.now() + 24 * 60 * 60 * 1000),
				time: '10:00',
				availableSeats: 2,
				costPerSeat: 50,
				distanceKm: 10,
			});
		}

		// Create a test message
		const testMessage = await Message.create({
			rideId: testRide._id,
			senderId: req.userId,
			senderName: 'Test User',
			text: 'Test message from API',
		});

		console.log('Test message created successfully:', testMessage._id);
		return res.status(201).json({ success: true, message: testMessage });
	} catch (err) {
		console.error('Test message creation error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
}

// Create message via API (fallback for socket issues)
async function createMessage(req, res) {
	try {
		console.log('createMessage called with body:', req.body);
		
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for message creation...');
			try {
			await mongoose.connect(MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for message creation');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const { rideId, text } = req.body;
		if (!rideId || !text) {
			return res.status(400).json({ error: 'rideId and text are required' });
		}

		const Message = require('../models/Message');
		const Ride = require('../models/Ride');
		const User = require('../models/User');

		// Verify ride exists
		const ride = await Ride.findById(rideId);
		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		// Get user info
		const user = await User.findById(req.userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Create message
		const message = await Message.create({
			rideId,
			senderId: req.userId,
			senderName: user.name,
			text: text.trim(),
		});

		console.log('Message created successfully:', message._id);
		return res.status(201).json({ success: true, message });
	} catch (err) {
		console.error('createMessage error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
}

module.exports = { getProfile, updateProfile, getInbox, testMessage, createMessage };
