const { Router } = require('express');
const { getProfile, updateProfile, getInbox, testMessage, createMessage } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/inbox', auth, getInbox);
router.post('/test-message', auth, testMessage);
router.post('/create-message', auth, createMessage);

module.exports = router;
