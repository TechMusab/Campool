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
				serverSelectionTimeoutMS: 10000, // 10 second timeout
				socketTimeoutMS: 45000, // 45 second timeout
				maxPoolSize: 1, // Important for serverless
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

// Routes - load each independently so one failure doesn't break all
function safeMount(path, getRouter) {
    try {
        const router = getRouter();
        app.use(path, router);
        console.log(`Mounted routes at ${path}`);
        return true;
    } catch (error) {
        console.error(`Failed to mount routes at ${path}:`, error.message);
        return false;
    }
}

const mounted = [];
mounted.push(safeMount('/api/auth', () => require('./routes/authRoutes')));
mounted.push(safeMount('/api', () => require('./routes/rideRoutes')));
mounted.push(safeMount('/api', () => require('./routes/ratingRoutes')));
mounted.push(safeMount('/api', () => require('./routes/statsRoutes')));
mounted.push(safeMount('/api/dashboard', () => require('./routes/dashboardRoutes')));
mounted.push(safeMount('/api/users', () => require('./routes/userRoutes')));

// Mount chat last; if it fails, other routes still work
mounted.push(safeMount('/api', () => require('./routes/chat')));

if (mounted.some(Boolean)) {
    console.log('Routes mounted (some may have been skipped)');
} else {
    console.error('No routes mounted successfully');
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

// Initialize database connection
connectDB();

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


// Export for Vercel
module.exports = app;