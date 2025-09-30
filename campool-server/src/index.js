require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campool';
const PORT = process.env.PORT || 4000;

async function start() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('Connected to MongoDB');

		io.on('connection', (socket) => {
			console.log('Socket connected:', socket.id);
			socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
		});

		app.use('/api/auth', authRoutes);

		app.get('/health', (req, res) => {
			res.json({ status: 'ok' });
		});

		server.listen(PORT, () => {
			console.log(`Server running on http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start server', error);
		process.exit(1);
	}
}

start();
