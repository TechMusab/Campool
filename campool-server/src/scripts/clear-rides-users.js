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

	console.log('Connecting to MongoDB to clear rides and users...');
	try {
		await mongoose.connect(mongoUri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			serverSelectionTimeoutMS: 15000,
			socketTimeoutMS: 45000,
			maxPoolSize: 2,
		});
		console.log('✅ Connected to MongoDB');

		const results = {};
		
		console.log('Deleting all rides...');
		results.rides = await Ride.deleteMany({});
		
		console.log('Deleting all users...');
		results.users = await User.deleteMany({});

		console.log('\n✅ Deletion complete:');
		console.log(`   - Rides deleted: ${results.rides.deletedCount}`);
		console.log(`   - Users deleted: ${results.users.deletedCount}`);

		await mongoose.disconnect();
		console.log('\n✅ Disconnected from MongoDB');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});

