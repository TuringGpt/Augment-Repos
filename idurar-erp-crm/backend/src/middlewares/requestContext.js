const { randomUUID } = require('crypto');

const { createLogger, runWithRequestContext } = require('../utils/logger');

const requestLogger = createLogger({ component: 'http' });

const getCorrelationIdFromHeaders = (headers = {}) => {
  const correlationIdHeader = headers['x-correlation-id'];

  if (typeof correlationIdHeader === 'string' && correlationIdHeader.trim()) {
    return correlationIdHeader.trim();
  }

  return randomUUID();
};

module.exports = (req, res, next) => {
  const correlationId = getCorrelationIdFromHeaders(req.headers);
  const startedAt = process.hrtime.bigint();

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  runWithRequestContext(
    {
      correlationId,
      method: req.method,
      path: req.originalUrl,
    },
    () => {
      req.log = createLogger({ component: 'request' });

      requestLogger.info('Incoming request');

      res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1000000;

        requestLogger.info('Request completed', {
          durationMs: Number(durationMs.toFixed(2)),
          statusCode: res.statusCode,
        });
      });

      next();
    }
  );
};