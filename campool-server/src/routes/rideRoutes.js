const { Router } = require('express');
const auth = require('../middleware/auth');
const { createRide, searchRides, getRideById, testRideCreation, getRideMessages, createMessage, getMessages, getInbox } = require('../controllers/rideController');

const router = Router();

router.post('/rides/create', auth, createRide);
router.get('/rides/search', searchRides);
router.get('/rides/:id', getRideById);
router.get('/rides/:id/messages', auth, getRideMessages);
router.post('/rides/test', auth, testRideCreation);

// Message endpoints
router.post('/messages/create', auth, createMessage);
router.get('/messages/ride/:id', auth, getMessages);
router.get('/messages/inbox', auth, getInbox);

module.exports = router; 