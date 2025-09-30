const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
	{
		rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
		driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		rating: { type: Number, required: true, min: 1, max: 5 },
		review: { type: String, maxlength: 300 },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

ratingSchema.index({ driverId: 1, createdAt: -1 });
ratingSchema.index({ rideId: 1, passengerId: 1 }, { unique: true }); // one rating per passenger per ride

module.exports = mongoose.model('Rating', ratingSchema); 