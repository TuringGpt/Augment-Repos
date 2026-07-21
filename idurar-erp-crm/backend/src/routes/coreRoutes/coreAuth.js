const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const { loginRateLimit } = require('@/middlewares/rateLimiters');

router.route('/login').post(loginRateLimit, catchErrors(adminAuth.login));

router.route('/forgetpassword').post(loginRateLimit, catchErrors(adminAuth.forgetPassword));
router.route('/resetpassword').post(loginRateLimit, catchErrors(adminAuth.resetPassword));

router.route('/logout').post(adminAuth.isValidAuthToken, catchErrors(adminAuth.logout));

module.exports = router;
