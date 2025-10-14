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
	},
	{ timestamps: true }
);

module.exports = mongoose.model('User', userSchema); 