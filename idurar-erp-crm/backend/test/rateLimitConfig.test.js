const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRateLimitResponseBody,
  getMailRateLimitKey,
  loginRateLimitOptions,
  mailRateLimitOptions,
} = require('../src/middlewares/rateLimit/config');

test('login rate limit is strict and ignores successful requests', () => {
  assert.equal(loginRateLimitOptions.windowMs, 15 * 60 * 1000);
  assert.equal(loginRateLimitOptions.max, 5);
  assert.equal(loginRateLimitOptions.skipSuccessfulRequests, true);
});

test('mail rate limit uses the authenticated admin id when available', () => {
  const key = getMailRateLimitKey({ admin: { _id: { toString: () => 'admin-123' } }, ip: '127.0.0.1' });

  assert.equal(key, 'admin-123');
  assert.equal(mailRateLimitOptions.windowMs, 60 * 60 * 1000);
  assert.equal(mailRateLimitOptions.max, 20);
});

test('mail rate limit falls back to the request ip and returns the expected payload', () => {
  assert.equal(getMailRateLimitKey({ ip: '127.0.0.1' }), '127.0.0.1');
  assert.deepEqual(
    createRateLimitResponseBody('Too many requests'),
    { success: false, result: null, message: 'Too many requests' }
  );
});