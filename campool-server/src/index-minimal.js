require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
				serverSelectionTimeoutMS: 10000,
				socketTimeoutMS: 45000,
				maxPoolSize: 1,
				heartbeatFrequencyMS: 10000,
			});
			console.log('✅ Connected to MongoDB successfully');
		}
	} catch (error) {
		console.error('❌ MongoDB connection error:', error);
	}
}

// User Schema
const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
	studentId: { type: String, required: true, unique: true },
	whatsappNumber: { type: String, required: true },
	status: { type: String, default: 'verified' },
	isVerified: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Routes
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
			connectionStates: {
				0: 'disconnected',
				1: 'connected',
				2: 'connecting',
				3: 'disconnecting'
			}
		}
	});
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
	try {
		console.log('Login attempt:', req.body.email);
		
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const valid = await bcrypt.compare(password, user.passwordHash);
		if (!valid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = jwt.sign({ sub: String(user._id), email: user.email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		
		console.log('Login successful for:', user.email);
		res.json({ 
			token, 
			user: { 
				id: user._id, 
				name: user.name, 
				email: user.email, 
				studentId: user.studentId, 
				whatsappNumber: user.whatsappNumber 
			} 
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
	try {
		console.log('Signup attempt:', req.body.email);
		
		const { name, email, password, studentId, whatsappNumber } = req.body;
		if (!name || !email || !password || !studentId || !whatsappNumber) {
			return res.status(400).json({ error: 'All fields are required' });
		}

		// Check if user already exists
		const existingUser = await User.findOne({ 
			$or: [
				{ email: email.toLowerCase() },
				{ studentId: studentId }
			]
		});
		
		if (existingUser) {
			return res.status(409).json({ error: 'User already exists' });
		}

		// Create new user
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({
			name,
			email: email.toLowerCase(),
			passwordHash,
			studentId,
			whatsappNumber,
			status: 'verified',
			isVerified: true
		});

		console.log('Signup successful for:', user.email);
		res.status(201).json({
			id: user._id,
			name: user.name,
			email: user.email,
			studentId: user.studentId,
			status: user.status,
			createdAt: user.createdAt,
		});
	} catch (error) {
		console.error('Signup error:', error);
		if (error.code === 11000) {
			return res.status(409).json({ error: 'Email or Student ID already exists' });
		}
		res.status(500).json({ error: 'Internal server error' });
	}
});


const authRouter = require('./routes/authRoutes');
app.use('/api/auth', authRouter);


// Test endpoint
app.get('/api/test', (req, res) => {
	res.json({ 
		message: 'Minimal API is working', 
		timestamp: new Date().toISOString() 
	});
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

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel
module.exports = app;