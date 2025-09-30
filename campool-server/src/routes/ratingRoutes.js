const { Router } = require('express');
const auth = require('../middleware/auth');
const { addRating, getDriverRatings } = require('../controllers/ratingController');

const router = Router();

router.post('/ratings/add', auth, addRating);
router.get('/ratings/driver/:driverId', getDriverRatings);

module.exports = router; 