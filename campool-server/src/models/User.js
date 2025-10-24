const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		passwordHash: { type: String, required: true },
		studentId: { type: String, required: true, unique: true, trim: true },
		whatsappNumber: { type: String, required: true, trim: true },
		avgRating: { type: Number, default: 0 },
		totalRatings: { type: Number, default: 0 },
		// User status: 'pending', 'verified', 'suspended'
		status: { type: String, enum: ['pending', 'verified', 'suspended'], default: 'verified' },
		// Driver status
		isDriver: { type: Boolean, default: false },
		driverLicense: { type: String },
		vehicleInfo: {
			make: { type: String },
			model: { type: String },
			year: { type: Number },
			color: { type: String },
			licensePlate: { type: String },
		},
		// Email verification fields
		isVerified: { type: Boolean, default: false },
		otpHash: { type: String },
		otpExpiresAt: { type: Date },
		otpAttemptCount: { type: Number, default: 0 },
		otpVerifyAttempts: { type: Number, default: 0 },
		otpRequestCount: { type: Number, default: 0 },
		otpRequestWindowStart: { type: Date },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('User', userSchema); 