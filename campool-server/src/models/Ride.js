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
		distanceKm: { type: Number, required: true },
		co2Saved: { type: Number, default: 0 },
		status: { type: String, enum: ['pending', 'confirmed', 'started', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
		passengers: [{ 
			userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			joinedAt: { type: Date, default: Date.now },
			status: { type: String, enum: ['joined', 'confirmed', 'completed', 'cancelled'], default: 'joined' }
		}],
		startedAt: { type: Date },
		completedAt: { type: Date },
		actualStartTime: { type: Date },
		actualEndTime: { type: Date },
	},
	{ timestamps: true }
);

rideSchema.index({ startPoint: 'text', destination: 'text' });

module.exports = mongoose.model('Ride', rideSchema); 