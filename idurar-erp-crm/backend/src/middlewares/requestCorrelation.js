const { AsyncLocalStorage } = require('async_hooks');
const { randomUUID } = require('crypto');

const CORRELATION_ID_HEADER = 'x-correlation-id';
const correlationStore = new AsyncLocalStorage();
const originalConsoleMethods = {};
const patchedConsoleSymbol = Symbol.for('idurar.requestCorrelation.consolePatched');

const sanitizeCorrelationId = (value) => {
  if (!value || typeof value !== 'string') return null;

  const correlationId = value.trim();
  if (!correlationId || correlationId.length > 128) return null;

  return /^[A-Za-z0-9_.:-]+$/.test(correlationId) ? correlationId : null;
};

const createCorrelationId = () => randomUUID();

const getCorrelationId = () => correlationStore.getStore()?.correlationId;

const formatLogArguments = (args) => {
  const correlationId = getCorrelationId();
  if (!correlationId) return args;

  return [`[correlationId=${correlationId}]`, ...args];
};

const patchConsole = () => {
  if (console[patchedConsoleSymbol]) return;

  ['debug', 'error', 'info', 'log', 'warn'].forEach((method) => {
    originalConsoleMethods[method] = console[method].bind(console);
    console[method] = (...args) => originalConsoleMethods[method](...formatLogArguments(args));
  });

  Object.defineProperty(console, patchedConsoleSymbol, {
    value: true,
    configurable: false,
    enumerable: false,
  });
};

const requestCorrelation = (req, res, next) => {
  const correlationId = sanitizeCorrelationId(req.get?.(CORRELATION_ID_HEADER)) || createCorrelationId();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  correlationStore.run({ correlationId }, next);
};

patchConsole();

module.exports = {
  CORRELATION_ID_HEADER,
  getCorrelationId,
  requestCorrelation,
  sanitizeCorrelationId,
};