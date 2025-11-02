require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Ride = require('../models/Ride');

async function main() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		console.error('MONGO_URI is not set. Aborting.');
		process.exit(1);
	}

	const dbName = process.env.MONGO_DB_NAME; // optional override
	console.log('Connecting...', { uri: mongoUri, dbName: dbName || '(default)' });
	await mongoose.connect(mongoUri, {
		serverSelectionTimeoutMS: 15000,
		socketTimeoutMS: 45000,
		maxPoolSize: 2,
		...(dbName ? { dbName } : {})
	});

	const db = mongoose.connection.getClient().db();
	console.log('Connected to database:', db.databaseName);

	const users = await User.countDocuments({});
	const rides = await Ride.countDocuments({});
	console.log('Counts =>', { users, rides });

	await mongoose.disconnect();
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});





