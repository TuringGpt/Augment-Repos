const assert = require('assert');
const { test } = require('node:test');

const {
  CORRELATION_ID_HEADER,
  getCorrelationId,
  requestCorrelation,
  sanitizeCorrelationId,
} = require('../src/middlewares/requestCorrelation');

const buildRequest = (headerValue) => ({
  get: (name) => (name.toLowerCase() === CORRELATION_ID_HEADER ? headerValue : undefined),
});

const buildResponse = () => ({
  headers: {},
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  },
});

test('assigns a generated correlation ID to the request context and response header', async () => {
  const req = buildRequest();
  const res = buildResponse();

  await new Promise((resolve, reject) => {
    requestCorrelation(req, res, () => {
      try {
        assert.match(req.correlationId, /^[0-9a-f-]{36}$/);
        assert.strictEqual(res.headers['x-correlation-id'], req.correlationId);
        assert.strictEqual(getCorrelationId(), req.correlationId);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
});

test('propagates a safe incoming correlation ID', async () => {
  const req = buildRequest('existing-request-123');
  const res = buildResponse();

  await new Promise((resolve) => {
    requestCorrelation(req, res, () => {
      assert.strictEqual(req.correlationId, 'existing-request-123');
      assert.strictEqual(res.headers['x-correlation-id'], 'existing-request-123');
      resolve();
    });
  });
});

test('rejects invalid incoming correlation IDs', () => {
  assert.strictEqual(sanitizeCorrelationId('bad id with spaces'), null);
  assert.strictEqual(sanitizeCorrelationId('bad\nvalue'), null);
  assert.strictEqual(sanitizeCorrelationId('safe.id-123:abc_def'), 'safe.id-123:abc_def');
});

test('prefixes console logs produced inside the request context', async () => {
  const req = buildRequest('log-test-123');
  const res = buildResponse();
  const writes = [];
  const originalWrite = process.stdout.write;

  process.stdout.write = (chunk, encoding, callback) => {
    writes.push(String(chunk));
    if (typeof encoding === 'function') encoding();
    if (typeof callback === 'function') callback();
    return true;
  };

  try {
    await new Promise((resolve) => {
      requestCorrelation(req, res, () => {
        console.log('request log message');
        resolve();
      });
    });
  } finally {
    process.stdout.write = originalWrite;
  }

  assert.match(writes.join(''), /\[correlationId=log-test-123\] request log message/);
});