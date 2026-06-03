/*
  Correlation ID Middleware

  Ensures every request carries a correlation ID. The ID is taken from an
  incoming `x-correlation-id` / `x-request-id` header when present (so an ID
  can be propagated across services) or generated otherwise. The ID is exposed
  on `req.correlationId`, echoed back in the `X-Correlation-Id` response header,
  and bound to the logger context so all downstream logs include it.
*/

const crypto = require('crypto');
const logger = require('@/utils/logger');

const RESPONSE_HEADER = 'X-Correlation-Id';

const correlationId = (req, res, next) => {
  const incomingId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  const id = incomingId || crypto.randomUUID();

  req.correlationId = id;
  res.setHeader(RESPONSE_HEADER, id);

  const start = Date.now();

  // The `finish` event fires outside the async context below, so re-bind the
  // correlation ID explicitly to keep the completion log correlated too.
  res.on('finish', () => {
    logger.runWithCorrelationId(id, () => {
      const duration = Date.now() - start;
      logger.info(`← ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
  });

  logger.runWithCorrelationId(id, () => {
    logger.info(`→ ${req.method} ${req.originalUrl}`);
    next();
  });
};

module.exports = correlationId;
