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
				serverSelectionRetryDelayMS: 5000,
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
