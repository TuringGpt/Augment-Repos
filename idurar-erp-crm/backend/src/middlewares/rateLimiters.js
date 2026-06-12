const rateLimit = require('express-rate-limit');

const buildRateLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        result: null,
        message,
      });
    },
  });

// Protect the authentication endpoint from brute-force and credential-stuffing attacks
const loginRateLimit = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
});

// Protect the mail endpoints from being abused to send a large volume of emails
const mailRateLimit = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many mail requests from this IP, please try again after 15 minutes.',
});

module.exports = {
  loginRateLimit,
  mailRateLimit,
};
