const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isUniversityEmail, requireFields } = require('../utils/validators');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const SALT_ROUNDS = 10;
const OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes
const OTP_MAX_REQUESTS_PER_HOUR = 5;
const OTP_MAX_VERIFY_ATTEMPTS = 10;

async function connectWithRetry(mongoUri, maxAttempts = 3) {
	const mongoose = require('mongoose');
	let attempt = 0;
	let lastError;
	while (attempt < maxAttempts) {
		try {
			await mongoose.connect(mongoUri, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				serverSelectionTimeoutMS: 15000,
				socketTimeoutMS: 45000,
				maxPoolSize: 1,
				serverSelectionRetryDelayMS: 3000,
				heartbeatFrequencyMS: 10000,
				bufferCommands: false,
				bufferMaxEntries: 0,
			});
			return true;
		} catch (err) {
			lastError = err;
			attempt++;
			const delayMs = 500 * Math.pow(2, attempt - 1);
			await new Promise(r => setTimeout(r, delayMs));
		}
	}
	throw lastError;
}

function generateOtp() {
    const num = Math.floor(100000 + Math.random() * 900000);
    return String(num);
}

function hashOtp(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

async function requestOtp(req, res) {
    try {
        // Force MongoDB connection for serverless environment
        const mongoose = require('mongoose');
        console.log('Current MongoDB state:', mongoose.connection.readyState);
        
        if (mongoose.connection.readyState === 0) {
            console.log('Connecting to MongoDB (OTP)...');
            try {
                await connectWithRetry(process.env.MONGO_URI, 3);
                console.log('✅ MongoDB connected successfully');
            } catch (connectError) {
                console.error('❌ MongoDB connection failed:', connectError);
                console.error('Connection error details:', {
                    message: connectError.message,
                    code: connectError.code,
                    name: connectError.name
                });
                return res.status(500).json({ error: 'Database connection failed' });
            }
        }

        const missing = requireFields(req.body, ['email']);
        if (missing) return res.status(400).json({ error: `Missing field: ${missing}` });

        const email = String(req.body.email).toLowerCase();
        if (!isUniversityEmail(email)) {
            return res.status(400).json({ error: 'Email must be a valid student domain' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            // Create pending user for OTP verification during signup
            user = await User.create({
                name: 'Pending',
                email,
                passwordHash: await bcrypt.hash(crypto.randomBytes(12).toString('hex'), SALT_ROUNDS),
                studentId: `PENDING-${crypto.randomBytes(6).toString('hex')}`,
                whatsappNumber: 'N/A',
                status: 'pending'
            });
        }

        const now = new Date();
        const windowStart = user.otpRequestWindowStart || new Date(now.getTime() - 61 * 60 * 1000);
        const withinWindow = now.getTime() - new Date(windowStart).getTime() < 60 * 60 * 1000;
        let requestCount = withinWindow ? (user.otpRequestCount || 0) : 0;
        if (requestCount >= OTP_MAX_REQUESTS_PER_HOUR) {
            return res.status(429).json({ error: 'Too many requests. Try again later.' });
        }

        const otp = generateOtp();
        user.otpHash = hashOtp(otp);
        user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
        user.otpAttemptCount = 0;
        user.otpRequestCount = requestCount + 1;
        user.otpRequestWindowStart = withinWindow ? windowStart : now;
        await user.save();

        await sendOtpEmail(email, otp);

        return res.json({ success: true, expiresInMs: OTP_TTL_MS });
    } catch (error) {
        console.error('requestOtp error', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function verifyOtp(req, res) {
    try {
        // Force MongoDB connection for serverless environment
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 0) {
            console.log('Connecting to MongoDB for OTP verification...');
            try {
                await connectWithRetry(process.env.MONGO_URI, 3);
                console.log('✅ MongoDB connected for verification');
            } catch (connectError) {
                console.error('❌ MongoDB connection failed:', connectError);
                console.error('Connection error details:', {
                    message: connectError.message,
                    code: connectError.code,
                    name: connectError.name
                });
                return res.status(500).json({ error: 'Database connection failed' });
            }
        }

        const missing = requireFields(req.body, ['email', 'otp']);
        if (missing) return res.status(400).json({ error: `Missing field: ${missing}` });

        const email = String(req.body.email).toLowerCase();
        const otp = String(req.body.otp);

        const user = await User.findOne({ email });
        if (!user || !user.otpHash || !user.otpExpiresAt) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        if (new Date() > new Date(user.otpExpiresAt)) {
            return res.status(400).json({ error: 'Code expired' });
        }

        if ((user.otpAttemptCount || 0) >= OTP_MAX_VERIFY_ATTEMPTS) {
            return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
        }

        const providedHash = hashOtp(otp);
        if (providedHash !== user.otpHash) {
            user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;
            await user.save();
            return res.status(400).json({ error: 'Invalid code' });
        }

        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        user.otpAttemptCount = 0;
        await user.save();

        const token = jwt.sign({ sub: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id: user._id, name: user.name, email: user.email, studentId: user.studentId, whatsappNumber: user.whatsappNumber, isVerified: user.isVerified } });
    } catch (error) {
        console.error('verifyOtp error', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function signup(req, res) {
console.log("=== SIGNUP REQUEST START ===");
console.log("Request body:", JSON.stringify(req.body, null, 2));
console.log("Request headers:", JSON.stringify(req.headers, null, 2));
	try {
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		console.log('Current MongoDB state:', mongoose.connection.readyState);
		
        if (mongoose.connection.readyState === 0) {
            console.log('Connecting to MongoDB for signup...');
            try {
                await connectWithRetry(process.env.MONGO_URI, 3);
                console.log('✅ MongoDB connected for signup');
            } catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

console.log("Step 1: Validating required fields...");
		const missing = requireFields(req.body, ['name', 'email', 'password', 'studentId', 'whatsappNumber', 'otp']);
		if (missing) {
console.log("? Missing field:", missing);
			return res.status(400).json({ error: `Missing field: ${missing}` });
		}

		const { name, email, password, studentId, whatsappNumber, otp } = req.body;
console.log("Extracted data:", { name, email, studentId, passwordLength: password?.length });
		if (!isUniversityEmail(email)) {
console.log("? Invalid university email:", email);
			return res.status(400).json({ error: 'Email must be a valid university address' });
		}

		// Check if user already exists
		const existingEmail = await User.findOne({ email: email.toLowerCase() });
console.log("Existing email check result:", existingEmail ? "Found existing user" : "No existing user");
		if (existingEmail && existingEmail.status !== 'pending') {
			return res.status(409).json({ error: 'Email already registered' });
		}

		const existingStudent = await User.findOne({ studentId });
console.log("Existing student ID check result:", existingStudent ? "Found existing student" : "No existing student");
		if (existingStudent && existingStudent.status !== 'pending') {
			return res.status(409).json({ error: 'Student ID already registered' });
		}

		// Verify OTP
		const user = existingEmail || await User.findOne({ email: email.toLowerCase() });
		console.log("User found for OTP verification:", user ? "Yes" : "No");
		if (user) {
			console.log("User OTP status:", {
				hasOtpHash: !!user.otpHash,
				hasOtpExpiresAt: !!user.otpExpiresAt,
				otpExpiresAt: user.otpExpiresAt,
				currentTime: new Date()
			});
		}
		
		if (!user || !user.otpHash || !user.otpExpiresAt) {
			return res.status(400).json({ error: 'OTP not requested or expired. Please request OTP first.' });
		}

		const now = new Date();
		if (now > user.otpExpiresAt) {
			return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
		}

		const providedOtpHash = hashOtp(otp);
		console.log("OTP verification:", {
			providedOtp: otp,
			providedHash: providedOtpHash,
			storedHash: user.otpHash,
			hashesMatch: providedOtpHash === user.otpHash
		});
		
		if (providedOtpHash !== user.otpHash) {
			console.log("❌ OTP verification failed - hashes don't match");
			// Increment verification attempts
			await User.findByIdAndUpdate(user._id, { 
				$inc: { otpVerifyAttempts: 1 } 
			});
			return res.status(400).json({ error: 'Invalid OTP' });
		}
		
		console.log("✅ OTP verification successful");

		// OTP is valid, complete the signup
		console.log("Step 2: Creating password hash...");
		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
		console.log("✅ Password hash created");
		
		if (existingEmail) {
			console.log("Step 3: Updating existing pending user...");
			// Update existing pending user
			const updateResult = await User.findByIdAndUpdate(user._id, {
				name,
				passwordHash,
				studentId,
				whatsappNumber,
				status: 'verified',
				$unset: { 
					otpHash: 1, 
					otpExpiresAt: 1, 
					otpVerifyAttempts: 1,
					otpRequestCount: 1,
					otpRequestWindowStart: 1
				}
			});
			console.log("✅ User updated successfully");
		} else {
			console.log("Step 3: Creating new verified user...");
			// Create new verified user
			const newUser = await User.create({ 
				name, 
				email: email.toLowerCase(), 
				passwordHash, 
				studentId, 
				whatsappNumber,
				status: 'verified'
			});
			console.log("✅ New user created successfully");
		}

		const finalUser = await User.findOne({ email: email.toLowerCase() });
console.log("? User created/updated successfully:", {
id: finalUser._id,
name: finalUser.name,
email: finalUser.email,
studentId: finalUser.studentId,
status: finalUser.status,
createdAt: finalUser.createdAt
});

		console.log("=== SIGNUP REQUEST SUCCESS ===");
return res.status(201).json({
			id: finalUser._id,
			name: finalUser.name,
			email: finalUser.email,
			studentId: finalUser.studentId,
			status: finalUser.status,
			createdAt: finalUser.createdAt,
		});
	} catch (error) {
		console.error('=== SIGNUP ERROR ===');
		console.error('Error type:', error.name);
		console.error('Error message:', error.message);
		console.error('Error stack:', error.stack);
		
		// Handle specific MongoDB errors
		if (error.name === 'ValidationError') {
			const errors = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({ error: `Validation error: ${errors.join(', ')}` });
		}
		
		if (error.code === 11000) {
			const field = Object.keys(error.keyPattern)[0];
			return res.status(409).json({ error: `${field} already exists` });
		}
		
		if (error.name === 'CastError') {
			return res.status(400).json({ error: 'Invalid data format' });
		}
		
		console.error('Signup error', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function login(req, res) {
	try {
console.log("Step 1: Validating required fields...");
		const missing = requireFields(req.body, ['email', 'password']);
		if (missing) {
console.log("? Missing field:", missing);
			return res.status(400).json({ error: `Missing field: ${missing}` });
		}

		const { email, password } = req.body;
		const user = await User.findOne({ email: String(email).toLowerCase() });
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const valid = await bcrypt.compare(password, user.passwordHash);
		if (!valid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = jwt.sign({ sub: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, name: user.name, email: user.email, studentId: user.studentId, whatsappNumber: user.whatsappNumber } });
	} catch (error) {
		console.error('Login error', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function createTestUser(req, res) {
	try {
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for test user creation...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for test user');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		// Check if test user already exists
		const existingUser = await User.findOne({ email: 'test@university.edu' });
		if (existingUser) {
			return res.json({ 
				message: 'Test user already exists',
				user: { 
					id: existingUser._id, 
					name: existingUser.name, 
					email: existingUser.email 
				}
			});
		}

		// Create test user
		const passwordHash = await bcrypt.hash('test123', SALT_ROUNDS);
		const testUser = await User.create({
			name: 'Test User',
			email: 'test@university.edu',
			passwordHash: passwordHash,
			studentId: 'TEST001',
			whatsappNumber: '+1234567890',
			status: 'verified',
			isVerified: true
		});

		console.log('✅ Test user created successfully');
		return res.status(201).json({
			message: 'Test user created successfully',
			user: {
				id: testUser._id,
				name: testUser.name,
				email: testUser.email,
				studentId: testUser.studentId
			}
		});
	} catch (error) {
		console.error('createTestUser error', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// Simple test user creation without OTP
async function createSimpleTestUser(req, res) {
	try {
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for simple test user creation...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for simple test user');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		// Check if test user already exists
		const existingUser = await User.findOne({ email: 'test@university.edu' });
		if (existingUser) {
			return res.json({ 
				message: 'Test user already exists',
				user: { 
					id: existingUser._id, 
					name: existingUser.name, 
					email: existingUser.email 
				}
			});
		}

		// Create test user
		const passwordHash = await bcrypt.hash('test123', SALT_ROUNDS);
		const testUser = await User.create({
			name: 'Test User',
			email: 'test@university.edu',
			passwordHash: passwordHash,
			studentId: 'TEST001',
			whatsappNumber: '+1234567890',
			status: 'verified',
			isVerified: true
		});

		console.log('✅ Simple test user created successfully');
		return res.status(201).json({
			message: 'Test user created successfully',
			user: {
				id: testUser._id,
				name: testUser.name,
				email: testUser.email,
				studentId: testUser.studentId
			}
		});
	} catch (error) {
		console.error('createSimpleTestUser error', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// Create multiple test users for testing
async function createTestUsers(req, res) {
	try {
		// Force MongoDB connection for serverless environment
		const mongoose = require('mongoose');
		if (mongoose.connection.readyState === 0) {
			console.log('Connecting to MongoDB for test users creation...');
			try {
				await mongoose.connect(process.env.MONGO_URI, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					serverSelectionTimeoutMS: 15000,
					socketTimeoutMS: 45000,
					maxPoolSize: 1,
				});
				console.log('✅ MongoDB connected for test users');
			} catch (connectError) {
				console.error('❌ MongoDB connection failed:', connectError);
				return res.status(500).json({ error: 'Database connection failed' });
			}
		}

		const testUsers = [
			{
				name: 'Alice Johnson',
				email: 'alice@university.edu',
				password: 'alice123',
				studentId: 'STU001',
				whatsappNumber: '+1234567890'
			},
			{
				name: 'Bob Smith',
				email: 'bob@university.edu',
				password: 'bob123',
				studentId: 'STU002',
				whatsappNumber: '+1234567891'
			}
		];

		const createdUsers = [];

		for (const userData of testUsers) {
			// Check if user already exists
			const existingUser = await User.findOne({ email: userData.email });
			if (existingUser) {
				createdUsers.push({
					message: `User ${userData.email} already exists`,
					user: {
						id: existingUser._id,
						name: existingUser.name,
						email: existingUser.email,
						studentId: existingUser.studentId
					}
				});
				continue;
			}

			// Create user
			const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
			const user = await User.create({
				name: userData.name,
				email: userData.email,
				passwordHash: passwordHash,
				studentId: userData.studentId,
				whatsappNumber: userData.whatsappNumber,
				status: 'verified',
				isVerified: true
			});

			createdUsers.push({
				message: `User ${userData.email} created successfully`,
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					studentId: user.studentId
				}
			});
		}

		console.log('✅ Test users created successfully');
		return res.status(201).json({
			message: 'Test users created successfully',
			users: createdUsers
		});
	} catch (error) {
		console.error('createTestUsers error', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = { signup, login, requestOtp, verifyOtp, createTestUser, createSimpleTestUser, createTestUsers };
