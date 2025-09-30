const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema(
	{
		lat: { type: Number },
		lng: { type: Number },
		label: { type: String },
	},
	{ _id: false }
);

const rideSchema = new mongoose.Schema(
	{
		driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		startPoint: { type: String, required: true },
		destination: { type: String, required: true },
		date: { type: Date, required: true },
		time: { type: String, required: true },
		availableSeats: { type: Number, required: true },
		costPerSeat: { type: Number, required: true },
	},
	{ timestamps: true }
);

rideSchema.index({ startPoint: 'text', destination: 'text' });

module.exports = mongoose.model('Ride', rideSchema); 