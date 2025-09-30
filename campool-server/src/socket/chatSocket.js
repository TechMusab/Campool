const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Ride = require('../models/Ride');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function setupChatSocket(httpServer) {
	const io = new Server(httpServer, {
		cors: { origin: '*', methods: ['GET', 'POST'] },
	});

	// Auth middleware for sockets
	io.use(async (socket, next) => {
		try {
			const token = socket.handshake?.auth?.token || socket.handshake?.query?.token;
			if (!token) return next(new Error('Unauthorized'));
			const payload = jwt.verify(String(token), JWT_SECRET);
			const user = await User.findById(payload.sub).select('name email').lean();
			if (!user) return next(new Error('Unauthorized'));
			socket.data.user = { id: String(user._id), name: user.name, email: user.email };
			return next();
		} catch (err) {
			return next(new Error('Unauthorized'));
		}
	});

	io.on('connection', (socket) => {
		const user = socket.data.user;
		console.log('Socket connected', socket.id, user?.email);

		socket.on('joinRoom', async (payload, ack) => {
			try {
				const { rideId } = payload || {};
				if (!rideId || !mongoose.isValidObjectId(rideId)) throw new Error('Invalid rideId');
				const ride = await Ride.findById(rideId).lean();
				if (!ride) throw new Error('Ride not found');
				socket.join(String(rideId));
				socket.to(String(rideId)).emit('userJoined', { userId: user.id, name: user.name });
				ack && ack({ ok: true });
			} catch (err) {
				ack && ack({ ok: false, error: err.message || 'join failed' });
			}
		});

		socket.on('leaveRoom', async (payload, ack) => {
			try {
				const { rideId } = payload || {};
				if (rideId) socket.leave(String(rideId));
				socket.to(String(rideId)).emit('userLeft', { userId: user.id, name: user.name });
				ack && ack({ ok: true });
			} catch (err) {
				ack && ack({ ok: false, error: err.message || 'leave failed' });
			}
		});

		socket.on('sendMessage', async (payload, ack) => {
			try {
				const { rideId, text } = payload || {};
				if (!rideId || !mongoose.isValidObjectId(rideId)) throw new Error('Invalid rideId');
				if (!text || !String(text).trim()) throw new Error('Text required');
				const ride = await Ride.findById(rideId).lean();
				if (!ride) throw new Error('Ride not found');
				const saved = await Message.create({
					rideId,
					senderId: user.id,
					senderName: user.name,
					text: String(text).trim(),
				});
				const msg = saved.toObject();
				io.to(String(rideId)).emit('receiveMessage', msg);
				ack && ack({ ok: true, message: msg });
			} catch (err) {
				ack && ack({ ok: false, error: err.message || 'send failed' });
			}
		});

		socket.on('typing', (payload) => {
			const { rideId } = payload || {};
			if (!rideId) return;
			socket.to(String(rideId)).emit('typing', { rideId, userId: user.id, name: user.name });
		});

		socket.on('stopTyping', (payload) => {
			const { rideId } = payload || {};
			if (!rideId) return;
			socket.to(String(rideId)).emit('stopTyping', { rideId, userId: user.id, name: user.name });
		});

		socket.on('disconnect', (reason) => {
			console.log('Socket disconnected', socket.id, reason);
		});
	});

	return io;
}

module.exports = { setupChatSocket }; 