const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
		senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		senderName: { type: String },
		text: { type: String, required: true },
		createdAt: { type: Date, default: Date.now, index: true },
		readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
		meta: { type: mongoose.Schema.Types.Mixed },
	},
	{ versionKey: false }
);

messageSchema.index({ rideId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema); 