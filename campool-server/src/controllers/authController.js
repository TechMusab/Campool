const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isUniversityEmail, requireFields } = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const SALT_ROUNDS = 10;

async function signup(req, res) {
	try {
		const missing = requireFields(req.body, ['name', 'email', 'password', 'studentId']);
		if (missing) {
			return res.status(400).json({ error: `Missing field: ${missing}` });
		}

		const { name, email, password, studentId } = req.body;
		if (!isUniversityEmail(email)) {
			return res.status(400).json({ error: 'Email must be a valid university address' });
		}

		const existingEmail = await User.findOne({ email: email.toLowerCase() });
		if (existingEmail) {
			return res.status(409).json({ error: 'Email already registered' });
		}

		const existingStudent = await User.findOne({ studentId });
		if (existingStudent) {
			return res.status(409).json({ error: 'Student ID already registered' });
		}

		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
		const user = await User.create({ name, email: email.toLowerCase(), passwordHash, studentId });

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
		const missing = requireFields(req.body, ['email', 'password']);
		if (missing) {
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
		return res.json({ token, user: { id: user._id, name: user.name, email: user.email, studentId: user.studentId } });
	} catch (error) {
		console.error('Login error', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = { signup, login }; 