const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		passwordHash: { type: String, required: true },
		studentId: { type: String, required: true, unique: true, trim: true },
	},
	{ timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ studentId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema); 