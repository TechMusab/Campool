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

// In-memory storage for OTPs (for testing only)
const otpStorage = new Map();

// Root endpoint
app.get('/', (req, res) => {
	res.json({ 
		message: 'Campool API Server', 
		status: 'running',
		timestamp: new Date().toISOString()
	});
});

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint
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
		storage: {
			otpCount: otpStorage.size,
			type: 'in-memory'
		}
	};
	
	res.json(diagnostic);
});

// OTP Request endpoint
app.post('/api/auth/request-otp', async (req, res) => {
	try {
		console.log('OTP request received:', req.body);
		
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ error: 'Email is required' });
		}

		// Simple email validation
		if (!email.includes('@')) {
			return res.status(400).json({ error: 'Invalid email format' });
		}

		// Generate OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
		
		// Store OTP in memory
		otpStorage.set(email.toLowerCase(), {
			otp: otp,
			expiresAt: expiresAt,
			attempts: 0
		});

		console.log(`OTP generated for ${email}: ${otp}`);

		// In production, send email here
		// For now, we'll just return success
		res.json({ 
			success: true, 
			message: 'OTP sent successfully',
			otp: otp, // Remove this in production
			expiresInMs: 120000
		});

	} catch (error) {
		console.error('OTP request error:', error);
		res.status(500).json({ error: 'Internal server error', details: error.message });
	}
});

// OTP Verify endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
	try {
		console.log('OTP verification received:', req.body);
		
		const { email, otp } = req.body;
		if (!email || !otp) {
			return res.status(400).json({ error: 'Email and OTP are required' });
		}

		const storedData = otpStorage.get(email.toLowerCase());
		if (!storedData) {
			return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
		}

		if (new Date() > new Date(storedData.expiresAt)) {
			otpStorage.delete(email.toLowerCase());
			return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
		}

		if (storedData.otp !== otp) {
			storedData.attempts += 1;
			if (storedData.attempts >= 3) {
				otpStorage.delete(email.toLowerCase());
				return res.status(400).json({ error: 'Too many attempts. Please request a new OTP.' });
			}
			return res.status(400).json({ error: 'Invalid OTP' });
		}

		// OTP is valid - clean up
		otpStorage.delete(email.toLowerCase());

		// Generate JWT token
		const jwt = require('jsonwebtoken');
		const token = jwt.sign(
			{ sub: email, email: email }, 
			process.env.JWT_SECRET || 'dev_secret', 
			{ expiresIn: '7d' }
		);

		res.json({ 
			token, 
			user: { 
				id: email,
				name: 'User',
				email: email, 
				studentId: 'STU001', 
				whatsappNumber: '+1234567890', 
				isVerified: true 
			} 
		});

	} catch (error) {
		console.error('OTP verification error:', error);
		res.status(500).json({ error: 'Internal server error', details: error.message });
	}
});

// Export for Vercel
module.exports = app;