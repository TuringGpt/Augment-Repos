const { AsyncLocalStorage } = require('async_hooks');

const requestContext = new AsyncLocalStorage();

const LOG_METHODS = {
  debug: 'log',
  info: 'log',
  warn: 'warn',
  error: 'error',
};

const serializeValue = (value) => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      accumulator[key] = serializeValue(nestedValue);
      return accumulator;
    }, {});
  }

  return value;
};

const normalizeMetadata = (metadata = {}) => serializeValue(metadata);

const getRequestContext = () => requestContext.getStore() || {};

const getCorrelationId = () => getRequestContext().correlationId || null;

const writeLog = (level, message, metadata = {}, baseContext = {}) => {
  const method = LOG_METHODS[level] || 'log';
  const requestMetadata = normalizeMetadata(getRequestContext());
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...requestMetadata,
    ...normalizeMetadata(baseContext),
    ...normalizeMetadata(metadata),
  };

  if (!logEntry.correlationId) {
    delete logEntry.correlationId;
  }

  console[method](JSON.stringify(logEntry));
};

const createLogger = (baseContext = {}) => ({
  debug(message, metadata = {}) {
    writeLog('debug', message, metadata, baseContext);
  },
  info(message, metadata = {}) {
    writeLog('info', message, metadata, baseContext);
  },
  warn(message, metadata = {}) {
    writeLog('warn', message, metadata, baseContext);
  },
  error(message, metadata = {}) {
    writeLog('error', message, metadata, baseContext);
  },
});

const logger = createLogger({ service: 'idurar-erp-crm-backend' });

const runWithRequestContext = (context, callback) => requestContext.run(context, callback);

module.exports = {
  createLogger,
  getCorrelationId,
  getRequestContext,
  logger,
  runWithRequestContext,
};