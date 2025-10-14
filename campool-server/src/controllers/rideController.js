const Ride = require('../models/Ride');
const User = require('../models/User');

function isFutureDate(dateString, timeString) {
	try {
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return false;
		let dt = date;
		if (timeString) {
			const [hh = '0', mm = '0'] = String(timeString).split(':');
			dt.setHours(Number(hh), Number(mm), 0, 0);
		}
		return dt.getTime() > Date.now();
	} catch {
		return false;
	}
}

async function createRide(req, res) {
	try {
		const { startPoint, destination, date, time, seats, costPerSeat, distanceKm } = req.body || {};
		if (!startPoint || !destination || !date || !time) {
			return res.status(400).json({ error: 'startPoint, destination, date and time are required' });
		}
		if (!isFutureDate(date, time)) {
			return res.status(400).json({ error: 'Date/time must be in the future' });
		}
		const seatsNum = Number(seats);
		const costNum = Number(costPerSeat);
		const distanceNum = Number(distanceKm);
		if (!(seatsNum > 0)) return res.status(400).json({ error: 'Seats must be > 0' });
		if (!(costNum > 0)) return res.status(400).json({ error: 'Cost per seat must be > 0' });
		if (!(distanceNum > 0)) return res.status(400).json({ error: 'distanceKm must be > 0' });

		const ride = await Ride.create({
			driverId: req.userId,
			startPoint,
			destination,
			date: new Date(date),
			time,
			availableSeats: seatsNum,
			costPerSeat: costNum,
			distanceKm: distanceNum,
		});

		const populated = await ride.populate({ path: 'driverId', select: 'name avgRating whatsappNumber' });
		return res.status(201).json({ success: true, ride: populated });
	} catch (err) {
		console.error('createRide error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function searchRides(req, res) {
	try {
		const { startPoint = '', destination = '', datetime, page = 1, limit = 10 } = req.query || {};
		const pageNum = Math.max(1, Number(page));
		const limitNum = Math.min(50, Math.max(1, Number(limit)));

		const query = {};
		const or = [];
		if (startPoint) or.push({ startPoint: { $regex: String(startPoint), $options: 'i' } });
		if (destination) or.push({ destination: { $regex: String(destination), $options: 'i' } });
		if (or.length) query.$or = or;

		if (datetime) {
			const after = new Date(String(datetime));
			if (!Number.isNaN(after.getTime())) {
				query.date = { $gte: after };
			}
		} else {
			query.date = { $gte: new Date() };
		}

		const rides = await Ride.find(query)
			.sort({ date: 1 })
			.skip((pageNum - 1) * limitNum)
			.limit(limitNum)
			.populate({ path: 'driverId', select: 'name avgRating whatsappNumber' })
			.lean();

		const items = rides.map((r) => {
			const totalCost = (r.costPerSeat || 0) * (r.availableSeats || 0);
			const numPassengers = Array.isArray(r.passengers) ? r.passengers.length : 0;
			const perPassengerCost = numPassengers > 0 ? totalCost / numPassengers : r.costPerSeat;
			return { ...r, totalCost, perPassengerCost };
		});

		const total = await Ride.countDocuments(query);
		return res.json({ items, page: pageNum, limit: limitNum, total });
	} catch (err) {
		console.error('searchRides error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function getRideById(req, res) {
	try {
		const { id } = req.params;
		const ride = await Ride.findById(id).populate({ path: 'driverId', select: 'name avgRating whatsappNumber' }).lean();
		if (!ride) return res.status(404).json({ error: 'Ride not found' });
		const totalCost = (ride.costPerSeat || 0) * (ride.availableSeats || 0);
		const numPassengers = Array.isArray(ride.passengers) ? ride.passengers.length : 0;
		const perPassengerCost = numPassengers > 0 ? totalCost / numPassengers : ride.costPerSeat;
		return res.json({ ...ride, totalCost, perPassengerCost });
	} catch (err) {
		console.error('getRideById error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = { createRide, searchRides, getRideById }; 