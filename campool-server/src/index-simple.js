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

// Database connection
const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
	try {
		if (mongoose.connection.readyState === 0) {
			console.log('Attempting to connect to MongoDB...');
			await mongoose.connect(MONGO_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				serverSelectionTimeoutMS: 10000,
				socketTimeoutMS: 45000,
				maxPoolSize: 1,
				serverSelectionRetryDelayMS: 5000,
				heartbeatFrequencyMS: 10000,
				bufferCommands: false,
				bufferMaxEntries: 0,
			});
			console.log('✅ Connected to MongoDB successfully');
		}
	} catch (error) {
		console.error('❌ MongoDB connection error:', error);
	}
}

// Simple User model
const userSchema = new mongoose.Schema({
	name: String,
	email: { type: String, unique: true },
	passwordHash: String,
	studentId: String,
	whatsappNumber: String,
	status: { type: String, default: 'pending' },
	isVerified: { type: Boolean, default: false },
	otpHash: String,
	otpExpiresAt: Date,
	otpAttemptCount: { type: Number, default: 0 },
	otpRequestCount: { type: Number, default: 0 },
	otpRequestWindowStart: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

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

// OTP Request endpoint
app.post('/api/auth/request-otp', async (req, res) => {
	try {
		console.log('OTP request received:', req.body);
		
		// Force MongoDB connection
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for OTP request...');
			await connectDB();
		}

		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ error: 'Email is required' });
		}

		// Simple email validation
		if (!email.includes('@')) {
			return res.status(400).json({ error: 'Invalid email format' });
		}

		// Find or create user
		let user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			user = await User.create({
				name: 'Pending',
				email: email.toLowerCase(),
				passwordHash: 'temp',
				studentId: `PENDING-${Date.now()}`,
				whatsappNumber: 'N/A',
				status: 'pending'
			});
		}

		// Generate OTP (for testing, we'll use a simple 6-digit number)
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		
		// Store OTP (in production, you'd hash this)
		user.otpHash = otp; // In production, hash this
		user.otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
		user.otpAttemptCount = 0;
		await user.save();

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
		res.status(500).json({ error: 'Internal server error' });
	}
});

// OTP Verify endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
	try {
		console.log('OTP verification received:', req.body);
		
		// Force MongoDB connection
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for OTP verification...');
			await connectDB();
		}

		const { email, otp } = req.body;
		if (!email || !otp) {
			return res.status(400).json({ error: 'Email and OTP are required' });
		}

		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user || !user.otpHash || !user.otpExpiresAt) {
			return res.status(400).json({ error: 'Invalid or expired OTP' });
		}

		if (new Date() > new Date(user.otpExpiresAt)) {
			return res.status(400).json({ error: 'OTP expired' });
		}

		if (user.otpHash !== otp) {
			user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;
			await user.save();
			return res.status(400).json({ error: 'Invalid OTP' });
		}

		// OTP is valid
		user.isVerified = true;
		user.otpHash = undefined;
		user.otpExpiresAt = undefined;
		user.otpAttemptCount = 0;
		await user.save();

		// Generate JWT token
		const jwt = require('jsonwebtoken');
		const token = jwt.sign(
			{ sub: String(user._id), email: user.email }, 
			process.env.JWT_SECRET || 'dev_secret', 
			{ expiresIn: '7d' }
		);

		res.json({ 
			token, 
			user: { 
				id: user._id, 
				name: user.name, 
				email: user.email, 
				studentId: user.studentId, 
				whatsappNumber: user.whatsappNumber, 
				isVerified: user.isVerified 
			} 
		});

	} catch (error) {
		console.error('OTP verification error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Initialize database connection
connectDB();

// Export for Vercel
module.exports = app;
