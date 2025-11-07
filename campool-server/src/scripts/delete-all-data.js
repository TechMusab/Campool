require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGO_URI/MONGODB_URI is not set. Aborting.');
		process.exit(1);
	}

	console.log('Connecting to MongoDB...');
	const maskedUri = mongoUri.replace(/:[^:@]+@/, ':****@');
	console.log('Connection string (masked):', maskedUri);
	
	const client = new MongoClient(mongoUri);
	
	try {
		await client.connect();
		console.log('✅ Connected to MongoDB');
		
		// List all databases
		const adminDb = client.db().admin();
		const { databases } = await adminDb.listDatabases();
		
		console.log('\n📋 Available databases:');
		databases.forEach(db => {
			if (db.name !== 'admin' && db.name !== 'local' && db.name !== 'config') {
				console.log(`   - ${db.name}`);
			}
		});
		
		// Try to find the database with data
		let targetDb = null;
		let maxCount = 0;
		
		for (const dbInfo of databases) {
			const dbName = dbInfo.name;
			if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;
			
			const db = client.db(dbName);
			const ridesCount = await db.collection('rides').countDocuments({});
			const usersCount = await db.collection('users').countDocuments({});
			const total = ridesCount + usersCount;
			
			if (total > maxCount) {
				maxCount = total;
				targetDb = dbName;
			}
			
			if (ridesCount > 0 || usersCount > 0) {
				console.log(`   ${dbName}: ${ridesCount} rides, ${usersCount} users`);
			}
		}
		
		if (!targetDb || maxCount === 0) {
			console.log('\n⚠️  No database found with rides or users.');
			await client.close();
			return;
		}
		
		console.log(`\n🎯 Target database: ${targetDb}`);
		const db = client.db(targetDb);
		
		// Get counts before deletion
		const ridesBefore = await db.collection('rides').countDocuments({});
		const usersBefore = await db.collection('users').countDocuments({});
		
		console.log('\n📊 Current counts:');
		console.log(`   - Rides: ${ridesBefore}`);
		console.log(`   - Users: ${usersBefore}`);
		
		if (ridesBefore === 0 && usersBefore === 0) {
			console.log('\n✅ Database is already empty.');
			await client.close();
			return;
		}
		
		// Delete all rides
		console.log('\n🗑️  Deleting all rides...');
		const ridesResult = await db.collection('rides').deleteMany({});
		console.log(`   ✅ Deleted ${ridesResult.deletedCount} rides`);
		
		// Delete all users
		console.log('🗑️  Deleting all users...');
		const usersResult = await db.collection('users').deleteMany({});
		console.log(`   ✅ Deleted ${usersResult.deletedCount} users`);
		
		// Verify deletion
		const ridesAfter = await db.collection('rides').countDocuments({});
		const usersAfter = await db.collection('users').countDocuments({});
		
		console.log('\n📊 Final counts:');
		console.log(`   - Rides: ${ridesAfter}`);
		console.log(`   - Users: ${usersAfter}`);
		
		if (ridesAfter === 0 && usersAfter === 0) {
			console.log('\n✅ All data successfully deleted!');
		} else {
			console.log('\n⚠️  Warning: Some documents may still exist.');
		}
		
		await client.close();
		console.log('\n✅ Disconnected from MongoDB');
	} catch (error) {
		console.error('❌ Error:', error);
		await client.close();
		process.exit(1);
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});

