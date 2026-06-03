const test = require('node:test');
const assert = require('node:assert/strict');

const { createLogger, runWithRequestContext } = require('./logger');

test('logger includes request context in downstream async logs', async () => {
  const entries = [];
  const originalLog = console.log;

  console.log = (entry) => entries.push(JSON.parse(entry));

  try {
    const testLogger = createLogger({ component: 'unit-test' });

    await new Promise((resolve) => {
      runWithRequestContext({ correlationId: 'corr-123', method: 'GET', path: '/health' }, () => {
        setImmediate(() => {
          testLogger.info('async log', { statusCode: 200 });
          resolve();
        });
      });
    });
  } finally {
    console.log = originalLog;
  }

  assert.equal(entries.length, 1);
  assert.equal(entries[0].correlationId, 'corr-123');
  assert.equal(entries[0].method, 'GET');
  assert.equal(entries[0].path, '/health');
  assert.equal(entries[0].component, 'unit-test');
  assert.equal(entries[0].statusCode, 200);
  assert.equal(entries[0].message, 'async log');
  assert.equal(entries[0].level, 'info');
});