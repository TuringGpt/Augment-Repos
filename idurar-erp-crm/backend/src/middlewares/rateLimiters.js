const rateLimit = require('express-rate-limit');

// Read a positive integer from the environment, falling back to a default
const envInt = (name, fallback) => {
  const parsed = parseInt(process.env[name], 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

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
  windowMs: envInt('LOGIN_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  limit: envInt('LOGIN_RATE_LIMIT_MAX', 10),
  message: 'Too many login attempts from this IP, please try again later.',
});

// Protect the mail endpoints from being abused to send a large volume of emails
const mailRateLimit = buildRateLimiter({
  windowMs: envInt('MAIL_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  limit: envInt('MAIL_RATE_LIMIT_MAX', 20),
  message: 'Too many mail requests from this IP, please try again later.',
});

module.exports = {
  loginRateLimit,
  mailRateLimit,
};
