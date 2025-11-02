require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Ride = require('../models/Ride');

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const PLACES = [
	{ city: 'Islamabad', spots: ['F-8 Markaz', 'F-10 Markaz', 'Blue Area', 'G-11 Markaz', 'Giga Mall'] },
	{ city: 'Rawalpindi', spots: ['Saddar', 'Commercial Market', 'Bahria Town', 'Askari 14', 'Chaklala'] },
	{ city: 'Lahore', spots: ['Johar Town', 'DHA Phase 5', 'Gulberg', 'Shadman', 'Model Town'] },
	{ city: 'Karachi', spots: ['DHA Phase 6', 'Clifton Block 5', 'Gulshan-e-Iqbal', 'Bahadurabad', 'Saddar'] },
];

function randomRoute() {
	const fromCity = pick(PLACES);
	let toCity;
	// 60% intra-city, 40% inter-city
	if (Math.random() < 0.6) {
		toCity = fromCity;
	} else {
		do { toCity = pick(PLACES); } while (toCity.city === fromCity.city);
	}
	const startPoint = `${fromCity.spots[randInt(0, fromCity.spots.length - 1)]}, ${fromCity.city}`;
	const destination = `${toCity.spots[randInt(0, toCity.spots.length - 1)]}, ${toCity.city}`;
	const distanceKm = fromCity.city === toCity.city ? randInt(3, 25) : randInt(150, 380);
	return { startPoint, destination, distanceKm };
}

function randomDateWithin(daysBack = 10, daysForward = 14) {
	const now = new Date();
	const offsetDays = randInt(-daysBack, daysForward);
	const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
	return d;
}

function randomTimeString() {
	const h = randInt(6, 21); // 6:00 to 21:59
	const m = randInt(0, 59);
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function main() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		console.error('MONGO_URI is not set. Aborting.');
		process.exit(1);
	}

	const total = Math.max(1, Math.min(Number(process.env.SEED_RIDES_COUNT) || 120, 1000));
	console.log(`Seeding ${total} rides ...`);

	await mongoose.connect(mongoUri, {
		serverSelectionTimeoutMS: 15000,
		socketTimeoutMS: 45000,
		maxPoolSize: 2,
	});

	const users = await User.find({ status: 'verified' }).select('_id name');
	if (users.length < 5) {
		console.error('Need at least 5 verified users to seed rides. Aborting.');
		process.exit(1);
	}

	let created = 0;
	for (let i = 0; i < total; i++) {
		const driver = pick(users);
		const { startPoint, destination, distanceKm } = randomRoute();
		const date = randomDateWithin();
		const time = randomTimeString();
		const availableSeats = randInt(1, 4);
		const costPerSeat = distanceKm <= 25 ? randInt(50, 200) : randInt(500, 2500);
		const co2Saved = Number((distanceKm * 0.12).toFixed(2));

		// Some rides have passengers
		const passengerCount = Math.max(0, availableSeats - randInt(0, availableSeats));
		const passengers = [];
		const used = new Set([String(driver._id)]);
		for (let p = 0; p < passengerCount; p++) {
			let candidate;
			let guard = 0;
			do { candidate = pick(users); guard++; } while (used.has(String(candidate._id)) && guard < 10);
			used.add(String(candidate._id));
			passengers.push({ userId: candidate._id, status: 'accepted' });
		}

		await Ride.create({
			driverId: driver._id,
			startPoint,
			destination,
			date,
			time,
			availableSeats,
			costPerSeat,
			distanceKm,
			co2Saved,
			status: pick(['pending','confirmed','confirmed','confirmed','started','completed']),
			passengers,
		});
		created++;
		if (created % 25 === 0) console.log(`created rides: ${created}`);
	}

	await mongoose.disconnect();
	console.log(`Done. Created ${created} rides.`);
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});





