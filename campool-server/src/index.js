require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const chatRoutes = require('./routes/chat');
const ratingRoutes = require('./routes/ratingRoutes');
const statsRoutes = require('./routes/statsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { setupChatSocket } = require('./socket/chatSocket');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 4000;

async function start() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('Connected to MongoDB');

		// REST routes
		app.use('/api/auth', authRoutes);
		app.use('/', rideRoutes);
		app.use('/', chatRoutes);
		app.use('/', ratingRoutes);
		app.use('/', statsRoutes);
		app.use('/api/dashboard', dashboardRoutes);

		app.get('/health', (req, res) => {
			res.json({ status: 'ok' });
		});

		// Socket.IO
		setupChatSocket(server);

		server.listen(PORT, "0.0.0.0", () => {
			console.log(`Server running on http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start server', error);
		process.exit(1);
	}
}

start();
