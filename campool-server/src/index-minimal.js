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

// In-memory storage for OTPs and rides (for testing only)
const otpStorage = new Map();
const ridesStorage = new Map();

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

// Get all rides endpoint
app.get('/api/rides', (req, res) => {
	try {
		const rides = Array.from(ridesStorage.values());
		res.json({
			success: true,
			rides: rides
		});
	} catch (error) {
		console.error('Get rides error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Post ride endpoint (alternative route for frontend compatibility)
app.post('/api/rides/create', (req, res) => {
	try {
		console.log('Post ride request received:', req.body);
		
		const { startPoint, destination, date, time, seats, costPerSeat, distanceKm, passengerPreference } = req.body;
		
		// Validate required fields
		if (!startPoint || !destination || !date || !time || !seats || !costPerSeat) {
			return res.status(400).json({ error: 'All fields are required' });
		}

		// Create ride object
		const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const ride = {
			_id: rideId,
			startPoint,
			destination,
			date: new Date(date).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
			time: time,
			availableSeats: parseInt(seats),
			costPerSeat: parseFloat(costPerSeat),
			totalCost: parseInt(seats) * parseFloat(costPerSeat),
			perPassengerCost: parseFloat(costPerSeat),
			distanceKm: parseFloat(distanceKm) || 10,
			driverId: 'unknown',
			passengers: [],
			status: 'pending',
			passengerPreference: passengerPreference || 'any',
			createdAt: new Date().toISOString()
		};

		// Store ride
		ridesStorage.set(rideId, ride);

		console.log(`✅ Ride created successfully: ${rideId}`);

		res.status(201).json({
			success: true,
			message: 'Ride posted successfully',
			ride: ride
		});

	} catch (error) {
		console.error('Post ride error:', error);
		res.status(500).json({ error: 'Internal server error', details: error.message });
	}
});

// Post ride endpoint
app.post('/api/rides', (req, res) => {
	try {
		console.log('Post ride request received:', req.body);
		
		const { startPoint, destination, date, time, availableSeats, costPerSeat, driverId } = req.body;
		
		// Validate required fields
		if (!startPoint || !destination || !date || !time || !availableSeats || !costPerSeat) {
			return res.status(400).json({ error: 'All fields are required' });
		}

		// Create ride object
		const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const ride = {
			_id: rideId,
			startPoint,
			destination,
			date,
			time,
			availableSeats: parseInt(availableSeats),
			costPerSeat: parseFloat(costPerSeat),
			totalCost: parseInt(availableSeats) * parseFloat(costPerSeat),
			perPassengerCost: parseFloat(costPerSeat),
			distanceKm: 10, // Default distance
			driverId: driverId || 'unknown',
			passengers: [],
			status: 'pending',
			createdAt: new Date().toISOString()
		};

		// Store ride
		ridesStorage.set(rideId, ride);

		console.log(`✅ Ride created successfully: ${rideId}`);

		res.status(201).json({
			success: true,
			message: 'Ride posted successfully',
			ride: ride
		});

	} catch (error) {
		console.error('Post ride error:', error);
		res.status(500).json({ error: 'Internal server error', details: error.message });
	}
});

// Get single ride endpoint
app.get('/api/rides/:id', (req, res) => {
	try {
		const rideId = req.params.id;
		const ride = ridesStorage.get(rideId);
		
		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		res.json({
			success: true,
			ride: ride
		});

	} catch (error) {
		console.error('Get ride error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Join ride endpoint
app.post('/api/rides/join', (req, res) => {
	try {
		console.log('Join ride request received:', req.body);
		
		const { rideId, userId } = req.body;
		
		if (!rideId || !userId) {
			return res.status(400).json({ error: 'rideId and userId are required' });
		}

		const ride = ridesStorage.get(rideId);
		if (!ride) {
			return res.status(404).json({ error: 'Ride not found' });
		}

		// Check if user is the driver
		if (ride.driverId === userId) {
			return res.status(400).json({ error: 'You cannot join your own ride' });
		}

		// Check if user already joined
		const existingPassenger = ride.passengers.find(p => p.userId === userId);
		if (existingPassenger) {
			return res.status(400).json({ error: 'You have already joined this ride' });
		}

		// Check available seats
		if (ride.passengers.length >= ride.availableSeats) {
			return res.status(400).json({ error: 'No available seats' });
		}

		// Add passenger
		ride.passengers.push({
			userId: userId,
			joinedAt: new Date().toISOString(),
			status: 'pending'
		});

		ridesStorage.set(rideId, ride);

		console.log(`✅ User ${userId} joined ride ${rideId}`);

		res.json({
			success: true,
			message: 'Join request sent successfully',
			ride: ride
		});

	} catch (error) {
		console.error('Join ride error:', error);
		res.status(500).json({ error: 'Internal server error', details: error.message });
	}
});

// Search rides endpoint
app.get('/api/rides/search', (req, res) => {
	try {
		const { startPoint, destination, date } = req.query;
		
		let rides = Array.from(ridesStorage.values());
		
		// Filter rides based on search criteria
		if (startPoint) {
			rides = rides.filter(ride => 
				ride.startPoint.toLowerCase().includes(startPoint.toLowerCase())
			);
		}
		
		if (destination) {
			rides = rides.filter(ride => 
				ride.destination.toLowerCase().includes(destination.toLowerCase())
			);
		}
		
		if (date) {
			rides = rides.filter(ride => ride.date === date);
		}

		res.json({
			success: true,
			rides: rides,
			count: rides.length
		});

	} catch (error) {
		console.error('Search rides error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Export for Vercel
module.exports = app;