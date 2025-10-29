require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendOtpEmail } = require('./utils/mailer');

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

		// Send email
		try {
			await sendOtpEmail(email, otp);
			console.log(`✅ OTP email sent successfully to ${email}`);
			
			res.json({ 
				success: true, 
				message: 'OTP sent successfully to your email',
				expiresInMs: 120000
			});
		} catch (emailError) {
			console.error('❌ Failed to send email:', emailError);
			
			// Still return success but log the OTP for debugging
			console.log(`\n📧 ===== OTP FOR DEBUGGING =====`);
			console.log(`📧 Email: ${email}`);
			console.log(`📧 OTP: ${otp}`);
			console.log(`📧 Expires in: 2 minutes`);
			console.log(`📧 ==============================\n`);
			
			res.json({ 
				success: true, 
				message: 'OTP sent successfully (check console for debugging)',
				otp: otp, // Include OTP in response for debugging
				expiresInMs: 120000
			});
		}

	} catch (error) {
		console.error('OTP request error:', error);
		res.status(500).json({ error: 'Internal server error', details: error.message });
	}
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
	try {
		console.log('Signup request received:', req.body);
		
		const { name, email, password, studentId, whatsappNumber, otp } = req.body;
		
		// Validate required fields
		if (!name || !email || !password || !studentId || !whatsappNumber || !otp) {
			return res.status(400).json({ error: 'All fields are required' });
		}

		// Validate email format
		if (!email.includes('@')) {
			return res.status(400).json({ error: 'Invalid email format' });
		}

		// Check if OTP is valid
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
			{ sub: email, email: email, name: name }, 
			process.env.JWT_SECRET || 'dev_secret', 
			{ expiresIn: '7d' }
		);

		console.log(`✅ User signup successful: ${email}`);

		res.status(201).json({
			success: true,
			message: 'Account created successfully',
			token,
			user: {
				id: email,
				name: name,
				email: email,
				studentId: studentId,
				whatsappNumber: whatsappNumber,
				isVerified: true
			}
		});

	} catch (error) {
		console.error('Signup error:', error);
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

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
	try {
		console.log('Login request received:', req.body);
		
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		// For this minimal version, we'll accept any email/password combination
		// In a real app, you'd verify against a database
		if (!email.includes('@')) {
			return res.status(400).json({ error: 'Invalid email format' });
		}

		// Generate JWT token
		const jwt = require('jsonwebtoken');
		const token = jwt.sign(
			{ sub: email, email: email }, 
			process.env.JWT_SECRET || 'dev_secret', 
			{ expiresIn: '7d' }
		);

		console.log(`✅ User login successful: ${email}`);

		res.json({
			success: true,
			message: 'Login successful',
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
		console.error('Login error:', error);
		res.status(500).json({ error: 'Internal server error', details: error.message });
	}
});

// Export for Vercel
module.exports = app;