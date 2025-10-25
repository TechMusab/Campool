const { Router } = require('express');
const { signup, login, requestOtp, verifyOtp, createTestUser } = require('../controllers/authController');

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/create-test-user', createTestUser);

module.exports = router; 