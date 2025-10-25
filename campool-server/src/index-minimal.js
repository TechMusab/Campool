require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Add error handling for missing environment variables
if (!process.env.MONGO_URI) {
	console.warn('WARNING: MONGO_URI environment variable is not set');
}

if (!process.env.JWT_SECRET) {
	console.warn('WARNING: JWT_SECRET environment variable is not set');
}

// Middleware
app.use(cors({
	origin: process.env.CORS_ORIGIN || '*',
	credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
	try {
		if (mongoose.connection.readyState === 0) {
			console.log('Attempting to connect to MongoDB...');
			await mongoose.connect(MONGO_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				serverSelectionTimeoutMS: 10000, // 10 second timeout
				socketTimeoutMS: 45000, // 45 second timeout
				maxPoolSize: 10,
				serverSelectionRetryDelayMS: 5000,
				heartbeatFrequencyMS: 10000,
			});
			console.log('✅ Connected to MongoDB successfully');
		} else {
			console.log('MongoDB already connected, state:', mongoose.connection.readyState);
		}
	} catch (error) {
		console.error('❌ MongoDB connection error:', error);
		console.error('Error details:', {
			message: error.message,
			code: error.code,
			name: error.name
		});
		// Don't throw error in serverless - let the app continue
	}
}

// Routes - with error handling
try {
	const authRoutes = require('./routes/authRoutes');
	const rideRoutes = require('./routes/rideRoutes');
	const chatRoutes = require('./routes/chat');
	const ratingRoutes = require('./routes/ratingRoutes');
	const statsRoutes = require('./routes/statsRoutes');
	const dashboardRoutes = require('./routes/dashboardRoutes');

	app.use('/api/auth', authRoutes);
	app.use('/api', rideRoutes);
	app.use('/api', chatRoutes);
	app.use('/api', ratingRoutes);
	app.use('/api', statsRoutes);
	app.use('/api/dashboard', dashboardRoutes);
	
	console.log('All routes loaded successfully');
} catch (error) {
	console.error('Error loading routes:', error);
	// Add a fallback route
	app.use('/api', (req, res) => {
		res.status(500).json({ error: 'Routes not loaded properly' });
	});
}

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
	res.json({ 
		message: 'Campool API Server', 
		status: 'running',
		timestamp: new Date().toISOString(),
		version: '2.0'
	});
});

// Add a simple test endpoint that doesn't require DB
app.get('/test', (req, res) => {
	res.json({ 
		message: 'Server is running', 
		timestamp: new Date().toISOString(),
		env: process.env.NODE_ENV || 'development'
	});
});

// Diagnostic endpoint
app.get('/diagnostic', (req, res) => {
	const diagnostic = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: {
			NODE_ENV: process.env.NODE_ENV || 'development',
			hasMongoUri: !!process.env.MONGO_URI,
			hasJwtSecret: !!process.env.JWT_SECRET,
			hasCorsOrigin: !!process.env.CORS_ORIGIN
		},
		mongodb: {
			connectionState: mongoose.connection.readyState,
			connectionStates: {
				0: 'disconnected',
				1: 'connected',
				2: 'connecting',
				3: 'disconnecting'
			}
		}
	};
	
	res.json(diagnostic);
});

// Test MongoDB connection endpoint
app.get('/test-db', async (req, res) => {
	try {
		console.log('Testing MongoDB connection...');
		console.log('Current state:', mongoose.connection.readyState);
		
		// Force connection for serverless
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB...');
			await mongoose.connect(process.env.MONGO_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				serverSelectionTimeoutMS: 15000,
				socketTimeoutMS: 45000,
				maxPoolSize: 1,
			});
			console.log('Connected to MongoDB');
		}
		
		// Test a simple database operation
		const testCollection = mongoose.connection.db.collection('test');
		const result = await testCollection.insertOne({ 
			test: 'connection', 
			timestamp: new Date(),
			message: 'Database connection successful!',
			serverless: true
		});
		
		console.log('Database write successful:', result.insertedId);
		
		res.json({ 
			status: 'success', 
			message: 'Database connection and write test successful!',
			connectionState: mongoose.connection.readyState,
			insertedId: result.insertedId,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Database test error:', error);
		res.status(500).json({ 
			status: 'error', 
			message: 'Database test failed',
			error: error.message,
			connectionState: mongoose.connection.readyState,
			code: error.code
		});
	}
});

// Join ride endpoint
app.post('/api/rides/join', async (req, res) => {
	try {
		console.log('Join ride request:', req.body);
		
		// Force MongoDB connection for serverless environment
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

		// Get user ID from Authorization header
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Authorization token required' });
		}

		const token = authHeader.slice(7);
		let userId;
		try {
			const jwt = require('jsonwebtoken');
			const payload = jwt.verify(token, process.env.JWT_SECRET);
			userId = payload.sub;
		} catch (jwtError) {
			return res.status(401).json({ error: 'Invalid token' });
		}

		// Import Ride model
		const Ride = require('./models/Ride');
		
		// Verify ride exists
		const ride = await Ride.findById(rideId);
		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		// Check if user is the driver
		if (ride.driverId.toString() === userId) {
			return res.status(400).json({ error: 'You cannot join your own ride' });
		}

		// Check if user already has a pending request
		const existingPassenger = ride.passengers.find(p => p.userId.toString() === userId);
		if (existingPassenger) {
			return res.status(400).json({ error: 'You have already requested to join this ride' });
		}

		// Check if there are available seats
		if (ride.passengers.length >= ride.availableSeats) {
			return res.status(400).json({ error: 'No available seats' });
		}

		// Add passenger request to ride
		ride.passengers.push({
			userId: userId,
			joinedAt: new Date(),
			status: 'pending' // Pending approval from driver
		});

		await ride.save();

		console.log('Join request sent successfully:', ride._id);
		return res.json({ 
			success: true, 
			message: 'Join request sent. The ride creator will be notified and can accept or reject your request.',
			ride: ride._id
		});
	} catch (err) {
		console.error('Join ride error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
});

// Respond to join request endpoint
app.post('/api/rides/respond-join', async (req, res) => {
	try {
		console.log('Respond to join request:', req.body);
		
		// Force MongoDB connection for serverless environment
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for join response...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for join response');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const { rideId, userId, action } = req.body;
		if (!rideId || !userId || !action) {
			return res.status(400).json({ error: 'rideId, userId, and action are required' });
		}

		// Get user ID from Authorization header
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Authorization token required' });
		}

		const token = authHeader.slice(7);
		let driverId;
		try {
			const jwt = require('jsonwebtoken');
			const payload = jwt.verify(token, process.env.JWT_SECRET);
			driverId = payload.sub;
		} catch (jwtError) {
			return res.status(401).json({ error: 'Invalid token' });
		}

		// Import Ride model
		const Ride = require('./models/Ride');
		
		// Verify ride exists and user is the driver
		const ride = await Ride.findById(rideId);
		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		if (ride.driverId.toString() !== driverId) {
			return res.status(403).json({ error: 'Only the ride creator can respond to join requests' });
		}

		// Find the passenger request
		const passengerIndex = ride.passengers.findIndex(p => p.userId.toString() === userId);
		if (passengerIndex === -1) {
			return res.status(404).json({ error: 'Join request not found' });
		}

		// Update passenger status
		ride.passengers[passengerIndex].status = action === 'accept' ? 'accepted' : 'rejected';

		// If accepted, update ride status
		if (action === 'accept' && ride.status === 'pending') {
			ride.status = 'confirmed';
		}

		await ride.save();

		console.log(`Join request ${action}ed successfully:`, ride._id);
		return res.json({ 
			success: true, 
			message: `Join request ${action}ed successfully`,
			ride: ride
		});
	} catch (err) {
		console.error('Respond to join request error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
});

// Get ride status endpoint
app.get('/api/rides/:id/status', async (req, res) => {
	try {
		console.log('Get ride status for:', req.params.id);
		
		// Force MongoDB connection for serverless environment
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
		if (!mongoose.Types.ObjectId.isValid(rideId)) {
			return res.status(400).json({ error: 'Invalid ride ID' });
		}

		// Get user ID from Authorization header
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Authorization token required' });
		}

		const token = authHeader.slice(7);
		let userId;
		try {
			const jwt = require('jsonwebtoken');
			const payload = jwt.verify(token, process.env.JWT_SECRET);
			userId = payload.sub;
		} catch (jwtError) {
			return res.status(401).json({ error: 'Invalid token' });
		}

		// Import Ride model
		const Ride = require('./models/Ride');
		
		const ride = await Ride.findById(rideId)
			.populate('driverId', 'name whatsappNumber')
			.populate('passengers.userId', 'name whatsappNumber');

		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		// Check if user is driver or passenger
		const isDriver = ride.driverId._id.toString() === userId;
		const isPassenger = ride.passengers.some(p => p.userId._id.toString() === userId);

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
		console.error('Get ride status error', err);
		return res.status(500).json({ error: 'Internal server error', details: err.message });
	}
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Error:', err);
	res.status(500).json({ 
		error: 'Internal Server Error',
		message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
	});
});

// 404 handler - use proper catch-all route (NO WILDCARDS)
app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

// Initialize database connection
connectDB();

// Export for Vercel
module.exports = app;
