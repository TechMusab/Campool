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
			await mongoose.connect(MONGO_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				serverSelectionTimeoutMS: 5000, // 5 second timeout
				socketTimeoutMS: 45000, // 45 second timeout
			});
			console.log('Connected to MongoDB');
		}
	} catch (error) {
		console.error('MongoDB connection error:', error);
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
	app.use('/api/*', (req, res) => {
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
		timestamp: new Date().toISOString()
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Error:', err);
	res.status(500).json({ 
		error: 'Internal Server Error',
		message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
	});
});

// 404 handler - use proper catch-all route
app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

// Initialize database connection
connectDB();

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

// Export for Vercel
module.exports = app;