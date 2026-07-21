const { AsyncLocalStorage } = require('async_hooks');

/*
  Correlation-aware logger

  We keep a per-request store (containing the correlation ID) in an
  AsyncLocalStorage instance. Any code that runs inside a request — even deep in
  async call chains — can read the current correlation ID without it being passed
  down explicitly. The exported logger prefixes every line with that ID so all
  logs originating from a single request can be grouped together.
*/

const correlationStorage = new AsyncLocalStorage();

// Returns the correlation ID for the current request context, if any.
const getCorrelationId = () => {
  const store = correlationStorage.getStore();
  return store ? store.correlationId : undefined;
};

const format = (message) => {
  const correlationId = getCorrelationId();
  return correlationId ? `[${correlationId}] ${message}` : `${message}`;
};

const write = (method, args) => {
  const [first, ...rest] = args;
  if (typeof first === 'string') {
    console[method](format(first), ...rest);
  } else {
    const correlationId = getCorrelationId();
    if (correlationId) {
      console[method](`[${correlationId}]`, ...args);
    } else {
      console[method](...args);
    }
  }
};

const logger = {
  log: (...args) => write('log', args),
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  debug: (...args) => write('debug', args),
};

module.exports = {
  correlationStorage,
  getCorrelationId,
  logger,
};
