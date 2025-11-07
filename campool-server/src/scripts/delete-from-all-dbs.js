require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGO_URI/MONGODB_URI is not set. Aborting.');
		process.exit(1);
	}

	console.log('Connecting to MongoDB...');
	console.log('Connection string (masked):', mongoUri.replace(/:[^:@]+@/, ':****@'));
	
	try {
		// Connect without specifying a database
		const uriWithoutDb = mongoUri.split('?')[0]; // Remove query params
		const adminUri = uriWithoutDb.endsWith('/') ? uriWithoutDb : uriWithoutDb + '/';
		
		await mongoose.connect(adminUri, {
			serverSelectionTimeoutMS: 15000,
			socketTimeoutMS: 45000,
			maxPoolSize: 2,
		});
		
		const adminDb = mongoose.connection.db.admin();
		const { databases } = await adminDb.listDatabases();
		
		console.log('\n📋 Available databases:');
		databases.forEach(db => {
			console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
		});
		
		// Try common database names
		const possibleDbNames = ['campool', 'test', 'campool-dev', 'campool-prod'];
		const dbToUse = possibleDbNames.find(name => 
			databases.some(db => db.name === name)
		) || 'campool'; // Default to campool
		
		console.log(`\n🎯 Using database: ${dbToUse}`);
		
		// Disconnect and reconnect to the specific database
		await mongoose.disconnect();
		
		// Add database name to URI if not present
		let finalUri = mongoUri;
		if (!mongoUri.includes('/' + dbToUse) && !mongoUri.includes('/' + dbToUse + '?')) {
			const separator = mongoUri.includes('?') ? '/' : '/';
			finalUri = mongoUri.replace(/\/(\?|$)/, `/${dbToUse}$1`);
		}
		
		await mongoose.connect(finalUri, {
			serverSelectionTimeoutMS: 15000,
			socketTimeoutMS: 45000,
			maxPoolSize: 2,
		});
		
		const db = mongoose.connection.db;
		const actualDbName = db.databaseName;
		console.log(`✅ Connected to database: ${actualDbName}`);
		
		// Load models with the correct connection
		const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
		const Ride = mongoose.model('Ride', new mongoose.Schema({}, { strict: false }), 'rides');
		
		// Get counts
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
		
		// Delete all
		console.log('\n🗑️  Deleting all rides...');
		const ridesResult = await Ride.deleteMany({});
		console.log(`   ✅ Deleted ${ridesResult.deletedCount} rides`);
		
		console.log('🗑️  Deleting all users...');
		const usersResult = await User.deleteMany({});
		console.log(`   ✅ Deleted ${usersResult.deletedCount} users`);
		
		// Verify
		const ridesAfter = await Ride.countDocuments({});
		const usersAfter = await User.countDocuments({});
		
		console.log('\n📊 Final counts:');
		console.log(`   - Rides: ${ridesAfter}`);
		console.log(`   - Users: ${usersAfter}`);
		
		await mongoose.disconnect();
		console.log('\n✅ Complete!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});

