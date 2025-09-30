const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Ride = require('../models/Ride');

const router = Router();

router.get('/chat/:rideId/messages', auth, async (req, res) => {
	try {
		const { rideId } = req.params;
		const { page = '1', limit = '50', before } = req.query;
		if (!mongoose.isValidObjectId(rideId)) return res.status(400).json({ error: 'Invalid rideId' });
		const ride = await Ride.findById(rideId).lean();
		if (!ride) return res.status(404).json({ error: 'Ride not found' });

		const pageNum = Math.max(1, Number(page));
		const limitNum = Math.min(100, Math.max(1, Number(limit)));
		const filter = { rideId };
		if (before) {
			const beforeDate = new Date(before);
			if (!Number.isNaN(beforeDate.getTime())) filter.createdAt = { $lt: beforeDate };
		}
		const items = await Message.find(filter)
			.sort({ createdAt: -1 })
			.limit(limitNum)
			.skip((pageNum - 1) * limitNum)
			.lean();
		const total = await Message.countDocuments(filter);
		const messagesDesc = items.reverse();
		const hasMore = pageNum * limitNum < total;
		return res.json({ messages: messagesDesc, page: pageNum, limit: limitNum, hasMore });
	} catch (err) {
		console.error('GET /chat/:rideId/messages error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

router.post('/chat/:rideId/read', auth, async (req, res) => {
	try {
		const { rideId } = req.params;
		const { lastSeenAt, lastMessageId } = req.body || {};
		if (!mongoose.isValidObjectId(rideId)) return res.status(400).json({ error: 'Invalid rideId' });
		const ride = await Ride.findById(rideId).lean();
		if (!ride) return res.status(404).json({ error: 'Ride not found' });

		const filter = { rideId };
		if (lastMessageId && mongoose.isValidObjectId(lastMessageId)) {
			const lastMsg = await Message.findById(lastMessageId).lean();
			if (lastMsg) filter.createdAt = { $lte: lastMsg.createdAt };
		} else if (lastSeenAt) {
			const d = new Date(lastSeenAt);
			if (!Number.isNaN(d.getTime())) filter.createdAt = { $lte: d };
		}

		await Message.updateMany(filter, { $addToSet: { readBy: req.userId } });
		return res.json({ success: true });
	} catch (err) {
		console.error('POST /chat/:rideId/read error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router; 