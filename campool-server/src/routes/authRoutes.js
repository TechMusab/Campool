const { Router } = require('express');
const { signup, login, requestOtp, verifyOtp, createTestUser, createTestUsers, createBulkUsers } = require('../controllers/authController');

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
// Backward/alternate route aliases for clients expecting different paths
router.post('/send-otp', requestOtp);
router.post('/check-otp', verifyOtp);
router.post('/create-test-user', createTestUser);
router.post('/create-test-users', createTestUsers);
router.post('/create-bulk-users', createBulkUsers);

module.exports = router; 