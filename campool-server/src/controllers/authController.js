const bcrypt = require('bcrypt');
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
            console.log('Connecting to MongoDB...');
            try {
                await mongoose.connect(process.env.MONGO_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    serverSelectionTimeoutMS: 15000,
                    socketTimeoutMS: 45000,
                    maxPoolSize: 1, // Important for serverless
                });
                console.log('✅ MongoDB connected successfully');
            } catch (connectError) {
                console.error('❌ MongoDB connection failed:', connectError);
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
                await mongoose.connect(process.env.MONGO_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    serverSelectionTimeoutMS: 15000,
                    socketTimeoutMS: 45000,
                    maxPoolSize: 1,
                });
                console.log('✅ MongoDB connected for verification');
            } catch (connectError) {
                console.error('❌ MongoDB connection failed:', connectError);
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
		if (!user || !user.otpHash || !user.otpExpiresAt) {
			return res.status(400).json({ error: 'OTP not requested or expired. Please request OTP first.' });
		}

		const now = new Date();
		if (now > user.otpExpiresAt) {
			return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
		}

		const providedOtpHash = hashOtp(otp);
		if (providedOtpHash !== user.otpHash) {
			// Increment verification attempts
			await User.findByIdAndUpdate(user._id, { 
				$inc: { otpVerifyAttempts: 1 } 
			});
			return res.status(400).json({ error: 'Invalid OTP' });
		}

		// OTP is valid, complete the signup
		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
		
		if (existingEmail) {
			// Update existing pending user
			await User.findByIdAndUpdate(user._id, {
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
		} else {
			// Create new verified user
			await User.create({ 
				name, 
				email: email.toLowerCase(), 
				passwordHash, 
				studentId, 
				whatsappNumber,
				status: 'verified'
			});
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

module.exports = { signup, login, requestOtp, verifyOtp };
