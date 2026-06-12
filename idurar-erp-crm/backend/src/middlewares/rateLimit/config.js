const createRateLimitResponseBody = (message) => ({
  success: false,
  result: null,
  message,
});

const createRateLimitHandler = ({ message }) => (req, res, _next, options) => {
  return res.status(options.statusCode).json(createRateLimitResponseBody(message));
};

const createRateLimitOptions = ({
  windowMs,
  max,
  message,
  keyGenerator,
  skipSuccessfulRequests = false,
}) => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests,
  keyGenerator,
  handler: createRateLimitHandler({ message }),
});

const getMailRateLimitKey = (req) => req.admin?._id?.toString?.() || req.ip;

const loginRateLimitOptions = createRateLimitOptions({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  skipSuccessfulRequests: true,
});

const mailRateLimitOptions = createRateLimitOptions({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many mail requests. Please try again in 1 hour.',
  keyGenerator: getMailRateLimitKey,
});

module.exports = {
  createRateLimitHandler,
  createRateLimitOptions,
  createRateLimitResponseBody,
  getMailRateLimitKey,
  loginRateLimitOptions,
  mailRateLimitOptions,
};