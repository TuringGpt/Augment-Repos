/*
  Standardized Logger

  A thin wrapper around the console that produces a consistent log format:

    [timestamp] [LEVEL] [correlationId] message

  The correlation ID is stored in an AsyncLocalStorage so it is automatically
  attached to every log emitted while handling a request, without having to
  pass it down through each function. Logs emitted outside of a request
  context (startup, CLI scripts) simply omit the correlation ID.
*/

const { AsyncLocalStorage } = require('async_hooks');

const correlationStore = new AsyncLocalStorage();

const getCorrelationId = () => {
  const store = correlationStore.getStore();
  return store ? store.correlationId : undefined;
};

const runWithCorrelationId = (correlationId, callback) => {
  return correlationStore.run({ correlationId }, callback);
};

const format = (level, args) => {
  const timestamp = new Date().toISOString();
  const correlationId = getCorrelationId();
  let prefix = `[${timestamp}] [${level}]`;
  if (correlationId) {
    prefix += ` [${correlationId}]`;
  }
  return [prefix, ...args];
};

const logger = {
  info: (...args) => console.info(...format('INFO', args)),
  warn: (...args) => console.warn(...format('WARN', args)),
  error: (...args) => console.error(...format('ERROR', args)),
  debug: (...args) => console.debug(...format('DEBUG', args)),
  log: (...args) => console.log(...format('INFO', args)),
  getCorrelationId,
  runWithCorrelationId,
};

module.exports = logger;
