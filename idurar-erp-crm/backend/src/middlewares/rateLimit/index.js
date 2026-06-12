const rateLimit = require('express-rate-limit');

const { loginRateLimitOptions, mailRateLimitOptions } = require('./config');

const loginRateLimit = rateLimit(loginRateLimitOptions);
const mailRateLimit = rateLimit(mailRateLimitOptions);

module.exports = {
  loginRateLimit,
  mailRateLimit,
};