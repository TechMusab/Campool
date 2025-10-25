const User = require('../models/User');

// Get user profile
async function getProfile(req, res) {
	try {
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for profile...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
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
				await mongoose.connect(process.env.MONGO_URI, {
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
				await mongoose.connect(process.env.MONGO_URI, {
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

module.exports = { getProfile, updateProfile, getInbox };
