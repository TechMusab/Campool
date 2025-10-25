const { Router } = require('express');
const auth = require('../middleware/auth');
const { createRide, searchRides, getRideById, testRideCreation, getRideMessages, updateRideStatus, joinRide, respondToJoinRequest, getRideStatus } = require('../controllers/rideController');

const router = Router();

router.post('/rides/create', auth, createRide);
router.get('/rides/search', searchRides);
router.get('/rides/:id', getRideById);
router.get('/rides/:id/messages', auth, getRideMessages);
router.post('/rides/test', auth, testRideCreation);

// Ride status management
router.put('/rides/status', auth, updateRideStatus);
router.post('/rides/join', auth, joinRide);
router.post('/rides/respond-join', auth, respondToJoinRequest);
router.get('/rides/:id/status', auth, getRideStatus);

module.exports = router; 