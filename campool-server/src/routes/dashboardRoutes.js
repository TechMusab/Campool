const { Router } = require('express');
const Ride = require('../models/Ride');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = Router();

// Get dashboard stats
router.get('/dashboard', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get ride statistics
        const rides = await Ride.find({
            $or: [
                { driverId: userId },
                { passengers: userId }
            ]
        });

        const totalRides = rides.length;
        const completedRides = rides.filter(ride => ride.status === 'completed').length;
        
        // Calculate savings (for passengers) or earnings (for drivers)
        let totalSaved = 0;
        let totalEarnings = 0;
        
        rides.forEach(ride => {
            if (ride.driverId.toString() === userId) {
                // Driver earnings
                totalEarnings += ride.costPerSeat * ride.passengers.length;
            } else if (ride.passengers.includes(userId)) {
                // Passenger savings (compared to solo ride)
                const soloCost = ride.costPerSeat * 4; // Assume 4 seats for solo ride
                const sharedCost = ride.costPerSeat;
                totalSaved += soloCost - sharedCost;
            }
        });

        // Calculate CO2 saved
        const co2Saved = rides.reduce((total, ride) => {
            return total + (ride.co2Saved || 0);
        }, 0);

        const stats = {
            totalRides,
            completedRides,
            totalSaved: user.isDriver ? totalEarnings : totalSaved,
            co2Saved: Math.round(co2Saved),
            avgRating: user.avgRating || 0,
            isDriver: user.isDriver || false,
        };

        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent rides
router.get('/recent', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;

        const rides = await Ride.find({
            $or: [
                { driverId: userId },
                { passengers: userId }
            ]
        })
        .populate('driverId', 'name avgRating')
        .populate('passengers', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

        const recentRides = rides.map(ride => ({
            id: ride._id,
            startPoint: ride.startPoint,
            destination: ride.destination,
            date: ride.date,
            time: ride.time,
            status: ride.status || 'pending',
            cost: ride.costPerSeat,
            driver: ride.driverId,
            passengers: ride.passengers,
            isDriver: ride.driverId._id.toString() === userId,
        }));

        res.json(recentRides);
    } catch (error) {
        console.error('Recent rides error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Smart ride matching
router.get('/smart-match', auth, async (req, res) => {
    try {
        const { userLat, userLng, destination, time } = req.query;
        
        if (!userLat || !userLng || !destination || !time) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Find rides going to similar destinations
        const rides = await Ride.find({
            destination: { $regex: destination, $options: 'i' },
            availableSeats: { $gt: 0 },
            date: { $gte: new Date() }
        })
        .populate('driverId', 'name avgRating whatsappNumber')
        .sort({ date: 1 });

        // Filter by proximity and time
        const nearbyRides = rides.filter(ride => {
            // Add proximity logic here
            return true; // Simplified for now
        });

        res.json({ rides: nearbyRides });
    } catch (error) {
        console.error('Smart matching error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Auto-join ride
router.post('/:rideId/auto-join', auth, async (req, res) => {
    try {
        const { rideId } = req.params;
        const userId = req.userId;

        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Check if user is already in the ride
        if (ride.passengers.includes(userId)) {
            return res.json({ success: true, message: 'Already joined' });
        }

        // Check if there are available seats
        if (ride.availableSeats <= 0) {
            return res.status(400).json({ error: 'No available seats' });
        }

        // Add user to passengers
        ride.passengers.push(userId);
        ride.availableSeats -= 1;
        
        await ride.save();

        res.json({ success: true, message: 'Successfully joined ride' });
    } catch (error) {
        console.error('Auto-join error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get ride coordination data
router.get('/:rideId/coordination', auth, async (req, res) => {
    try {
        const { rideId } = req.params;
        const userId = req.userId;

        const ride = await Ride.findById(rideId)
            .populate('driverId', 'name whatsappNumber')
            .populate('passengers', 'name whatsappNumber');

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Check if user is part of this ride
        const isDriver = ride.driverId._id.toString() === userId;
        const isPassenger = ride.passengers.some(p => p._id.toString() === userId);

        if (!isDriver && !isPassenger) {
            return res.status(403).json({ error: 'Not authorized to view this ride' });
        }

        const coordination = {
            rideId: ride._id,
            status: ride.status || 'pending',
            driver: ride.driverId,
            passengers: ride.passengers,
            startPoint: ride.startPoint,
            destination: ride.destination,
            date: ride.date,
            time: ride.time,
            costPerSeat: ride.costPerSeat,
            availableSeats: ride.availableSeats,
            isDriver,
            isPassenger,
        };

        res.json(coordination);
    } catch (error) {
        console.error('Ride coordination error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
