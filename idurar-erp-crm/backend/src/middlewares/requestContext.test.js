const test = require('node:test');
const assert = require('node:assert/strict');

const requestContext = require('./requestContext');

test('request context middleware reuses incoming correlation ids and exposes request-scoped logging', async () => {
  const entries = [];
  const originalLog = console.log;
  let finishHandler;

  console.log = (entry) => entries.push(JSON.parse(entry));

  const req = {
    headers: { 'x-correlation-id': 'req-123' },
    method: 'POST',
    originalUrl: '/api/login',
  };

  const res = {
    statusCode: 201,
    on(event, handler) {
      if (event === 'finish') {
        finishHandler = handler;
      }
    },
    setHeader(name, value) {
      this[name] = value;
    },
  };

  try {
    await new Promise((resolve, reject) => {
      requestContext(req, res, () => {
        try {
          req.log.info('Controller log');
          finishHandler();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } finally {
    console.log = originalLog;
  }

  assert.equal(req.correlationId, 'req-123');
  assert.equal(res['x-correlation-id'], 'req-123');
  assert.equal(typeof req.log.info, 'function');
  assert.equal(entries[0].message, 'Incoming request');
  assert.equal(entries[1].message, 'Controller log');
  assert.equal(entries[2].message, 'Request completed');
  assert.equal(entries[1].correlationId, 'req-123');
  assert.equal(entries[2].statusCode, 201);
});

test('request context middleware generates a correlation id when one is missing', async () => {
  const originalLog = console.log;
  let generatedCorrelationId;

  console.log = () => {};

  const req = {
    headers: {},
    method: 'GET',
    originalUrl: '/api/ping',
  };

  const res = {
    statusCode: 200,
    on() {},
    setHeader(name, value) {
      if (name === 'x-correlation-id') {
        generatedCorrelationId = value;
      }
    },
  };

  try {
    await new Promise((resolve, reject) => {
      requestContext(req, res, () => {
        try {
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } finally {
    console.log = originalLog;
  }

  assert.match(generatedCorrelationId, /^[0-9a-f-]{36}$/i);
  assert.equal(req.correlationId, generatedCorrelationId);
});