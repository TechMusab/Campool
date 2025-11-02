require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const SALT_ROUNDS = 10;

const FIRST_NAMES = [
	'Muhammad','Ahmed','Ali','Hassan','Hussein','Omar','Yusuf','Ibrahim','Ismail','Khalid',
	'Bilal','Hamza','Talha','Imran','Zaid','Usman','Ayaan','Rayyan','Farhan','Sami',
	'Aisha','Fatima','Khadija','Zainab','Maryam','Amina','Hafsa','Sumaya','Layla','Noor',
	'Sana','Hira','Iqra','Yasmin','Nadia','Rabia','Mehwish','Maliha','Huda','Sara'
];

const LAST_NAMES = [
	'Khan','Ahmed','Hussain','Ali','Sheikh','Farooq','Siddiqui','Qureshi','Ansari','Rahman',
	'Chaudhry','Malik','Dar','Mir','Shah','Syed','Raza','Naqvi','Kazmi','Bukhari',
	'Hashmi','Jafri','Gillani','Abbasi','Yousaf','Anwar','Akhtar','Zaman','Nawaz','Usmani'
];

// Pakistani mobile numbers format: +92 3XX XXXXXXX => '+923' + 9 digits
const COUNTRY_CODES = ['+92'];

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function randomDigits(n) {
	let s = '';
	for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
	return s;
}

function generatePakistanMsisdn() {
	return '+923' + randomDigits(9);
}

function generateNuEmail() {
	const digits = randomDigits(4);
	return `i22${digits}@nu.edu.pk`;
}

function generateUserData(i, domain) {
	const first = pick(FIRST_NAMES);
	const last = pick(LAST_NAMES);
	const idx = String(i).padStart(3, '0');
	// University email pattern: i22xxxx@nu.edu.pk
	const email = generateNuEmail();
	const studentYear = 20 + Math.floor(Math.random()*10); // 20-29 ⇒ 2020-2029
	const studentId = `STU${studentYear}${randomDigits(4)}`;
	const phone = generatePakistanMsisdn();
	return {
		name: `${first} ${last}`,
		email,
		studentId,
		whatsappNumber: phone
	};
}

async function main() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		console.error('MONGO_URI is not set. Aborting.');
		process.exit(1);
	}

	const total = Math.max(1, Math.min(Number(process.env.SEED_COUNT) || 200, 1000));
	const domain = String(process.env.SEED_DOMAIN || 'university.edu');

	console.log(`Seeding ${total} users into ${mongoUri} with domain ${domain} ...`);

	await mongoose.connect(mongoUri, {
		serverSelectionTimeoutMS: 15000,
		socketTimeoutMS: 45000,
		maxPoolSize: 2,
	});

	const passwordHash = await bcrypt.hash('TestUser@123', SALT_ROUNDS);
	let created = 0;
	const seenEmails = new Set();
	const seenStudentIds = new Set();

	for (let i = 1; i <= total; i++) {
		let data;
		let attempts = 0;
		do {
			data = generateUserData(i, domain);
			attempts++;
		} while ((seenEmails.has(data.email) || seenStudentIds.has(data.studentId)) && attempts < 5);

		// Ensure uniqueness in DB
		const existing = await User.findOne({ $or: [{ email: data.email }, { studentId: data.studentId }] });
		if (existing) {
			console.log(`exists: ${existing.email || existing.studentId}`);
			continue;
		}

		await User.create({
			name: data.name,
			email: data.email,
			passwordHash,
			studentId: data.studentId,
			whatsappNumber: data.whatsappNumber,
			status: 'verified',
			isVerified: true,
		});
		seenEmails.add(data.email);
		seenStudentIds.add(data.studentId);
		created++;
		if (created % 25 === 0) console.log(`created so far: ${created}`);
	}

	await mongoose.disconnect();
	console.log(`Done. Created ${created} users.`);
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});


