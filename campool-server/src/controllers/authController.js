const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isUniversityEmail, requireFields } = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const SALT_ROUNDS = 10;

async function signup(req, res) {
console.log("=== SIGNUP REQUEST START ===");
console.log("Request body:", JSON.stringify(req.body, null, 2));
console.log("Request headers:", JSON.stringify(req.headers, null, 2));
	try {
console.log("Step 1: Validating required fields...");
		const missing = requireFields(req.body, ['name', 'email', 'password', 'studentId', 'whatsappNumber']);
		if (missing) {
console.log("? Missing field:", missing);
			return res.status(400).json({ error: `Missing field: ${missing}` });
		}

		const { name, email, password, studentId, whatsappNumber } = req.body;
console.log("Extracted data:", { name, email, studentId, passwordLength: password?.length });
		if (!isUniversityEmail(email)) {
console.log("? Invalid university email:", email);
			return res.status(400).json({ error: 'Email must be a valid university address' });
		}

		const existingEmail = await User.findOne({ email: email.toLowerCase() });
console.log("Existing email check result:", existingEmail ? "Found existing user" : "No existing user");
		if (existingEmail) {
			return res.status(409).json({ error: 'Email already registered' });
		}

		const existingStudent = await User.findOne({ studentId });
console.log("Existing student ID check result:", existingStudent ? "Found existing student" : "No existing student");
		if (existingStudent) {
			return res.status(409).json({ error: 'Student ID already registered' });
		}

		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
		const user = await User.create({ name, email: email.toLowerCase(), passwordHash, studentId, whatsappNumber });
console.log("? User created successfully:", {
id: user._id,
name: user.name,
email: user.email,
studentId: user.studentId,
createdAt: user.createdAt
});

		console.log("=== SIGNUP REQUEST SUCCESS ===");
return res.status(201).json({
			id: user._id,
			name: user.name,
			email: user.email,
			studentId: user.studentId,
			createdAt: user.createdAt,
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

module.exports = { signup, login }; 
