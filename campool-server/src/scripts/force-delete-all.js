require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Ride = require('../models/Ride');

async function main() {
	const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
	if (!mongoUri) {
		console.error('MONGO_URI/MONGODB_URI is not set. Aborting.');
		process.exit(1);
	}

	console.log('Connecting to MongoDB...');
	console.log('Connection string (masked):', mongoUri.replace(/:[^:@]+@/, ':****@'));
	
	try {
		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 15000,
			socketTimeoutMS: 45000,
			maxPoolSize: 2,
		});
		
		const db = mongoose.connection.db;
		const dbName = db.databaseName;
		console.log(`✅ Connected to database: ${dbName}`);
		
		// Get counts before deletion
		const ridesBefore = await Ride.countDocuments({});
		const usersBefore = await User.countDocuments({});
		
		console.log('\n📊 Current counts:');
		console.log(`   - Rides: ${ridesBefore}`);
		console.log(`   - Users: ${usersBefore}`);
		
		if (ridesBefore === 0 && usersBefore === 0) {
			console.log('\n✅ Database is already empty.');
			await mongoose.disconnect();
			return;
		}
		
		// Delete all rides
		console.log('\n🗑️  Deleting all rides...');
		const ridesResult = await Ride.deleteMany({});
		console.log(`   ✅ Deleted ${ridesResult.deletedCount} rides`);
		
		// Delete all users
		console.log('🗑️  Deleting all users...');
		const usersResult = await User.deleteMany({});
		console.log(`   ✅ Deleted ${usersResult.deletedCount} users`);
		
		// Verify deletion
		const ridesAfter = await Ride.countDocuments({});
		const usersAfter = await User.countDocuments({});
		
		console.log('\n📊 Final counts:');
		console.log(`   - Rides: ${ridesAfter}`);
		console.log(`   - Users: ${usersAfter}`);
		
		if (ridesAfter === 0 && usersAfter === 0) {
			console.log('\n✅ All rides and users successfully deleted!');
		} else {
			console.log('\n⚠️  Warning: Some documents may still exist.');
			console.log('   This could indicate a connection to a different database.');
		}
		
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

