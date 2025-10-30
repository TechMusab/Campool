const { Router } = require('express');
const { signup, login, requestOtp, verifyOtp, createTestUser, createTestUsers } = require('../controllers/authController');

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/request-otp', requestOtp);
// compatibility alias for clients expecting /send-otp
router.post('/send-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/create-test-user', createTestUser);
router.post('/create-test-users', createTestUsers);

module.exports = router; 