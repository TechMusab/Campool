require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Rating = require('../models/Rating');
const Message = require('../models/Message');

async function main() {
	const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
	if (!mongoUri) {
		console.error('MONGO_URI/MONGODB_URI is not set. Aborting.');
		process.exit(1);
	}

	console.log('Connecting to MongoDB to reset collections...');
	await mongoose.connect(mongoUri, {
		serverSelectionTimeoutMS: 15000,
		socketTimeoutMS: 45000,
		maxPoolSize: 2,
	});

	const db = mongoose.connection.getClient().db();
	console.log('Connected to database:', db.databaseName);

	const results = {};
	results.users = await User.deleteMany({});
	results.rides = await Ride.deleteMany({});
	results.ratings = await Rating.deleteMany({});
	results.messages = await Message.deleteMany({});

	console.log('Deleted counts:', {
		users: results.users.deletedCount,
		rides: results.rides.deletedCount,
		ratings: results.ratings.deletedCount,
		messages: results.messages.deletedCount,
	});

	await mongoose.disconnect();
	console.log('Reset complete.');
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});





