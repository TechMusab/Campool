require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors({
	origin: process.env.CORS_ORIGIN || '*',
	credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple health
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Diagnostic
app.get('/diagnostic', (req, res) => {
	res.json({
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
			connectionStates: { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
		}
	});
});

// Mount only auth routes
try {
	const authRouter = require('./routes/authRoutes');
	app.use('/api/auth', authRouter);
	console.log('Mounted /api/auth routes');
} catch (e) {
	console.error('Failed to mount /api/auth routes:', e.message);
}

// Optional: minimal test endpoint
app.get('/api/test', (req, res) => {
	res.json({ message: 'Auth-only API is running', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;


