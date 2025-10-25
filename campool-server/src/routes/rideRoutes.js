const { Router } = require('express');
const auth = require('../middleware/auth');
const { createRide, searchRides, getRideById, testRideCreation } = require('../controllers/rideController');

const router = Router();

router.post('/rides/create', auth, createRide);
router.get('/rides/search', searchRides);
router.get('/rides/:id', getRideById);
router.post('/rides/test', auth, testRideCreation);

module.exports = router; 