require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
	origin: process.env.CORS_ORIGIN || '*',
	credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// 404 handler - NO WILDCARDS
app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel
module.exports = app;
