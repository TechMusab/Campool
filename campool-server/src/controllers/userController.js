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

module.exports = { getProfile, updateProfile };
