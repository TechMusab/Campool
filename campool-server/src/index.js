require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const chatRoutes = require('./routes/chat');
const ratingRoutes = require('./routes/ratingRoutes');
const { signup, login } = require('./controllers/authController');
const { setupChatSocket } = require('./socket/chatSocket');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campool';
const PORT = process.env.PORT || 4000;

async function start() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('Connected to MongoDB');

		// REST routes
		app.use('/api/auth', authRoutes);
		app.post('/auth/register', signup);
		app.post('/auth/login', login);
		app.use('/', rideRoutes);
		app.use('/', chatRoutes);
		app.use('/', ratingRoutes);

		app.get('/health', (req, res) => {
			res.json({ status: 'ok' });
		});

		// Socket.IO
		setupChatSocket(server);

		server.listen(PORT, () => {
			console.log(`Server running on http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start server', error);
		process.exit(1);
	}
}

start();
