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

// Initialize database connection
connectDB();

// Simple test endpoint
app.get('/test', (req, res) => {
	res.json({ 
		message: 'Server is running', 
		timestamp: new Date().toISOString(),
		env: process.env.NODE_ENV || 'development'
	});
});

// Root endpoint
app.get('/', (req, res) => {
	res.json({ 
		message: 'Campool API Server - Minimal Version', 
		status: 'running',
		timestamp: new Date().toISOString()
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

// 404 handler - NO WILDCARDS
app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel
module.exports = app;
