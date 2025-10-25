const { Router } = require('express');
const { getProfile, updateProfile, getInbox } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/inbox', auth, getInbox);

module.exports = router;
