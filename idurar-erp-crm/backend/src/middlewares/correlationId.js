const { randomUUID } = require('crypto');

const { correlationStorage, logger } = require('@/utils/logger');

const CORRELATION_HEADER = 'x-correlation-id';

// Only accept well-formed UUIDs from callers to prevent header-injection attacks.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (value) => typeof value === 'string' && UUID_REGEX.test(value);

/*
  Correlation ID middleware

  Assigns a unique correlation ID to every incoming request. An inbound
  X-Correlation-Id / X-Request-Id header is reused when it contains a valid UUID
  (enabling cross-service tracing), but any non-UUID value is discarded and a new
  ID is generated to prevent clients from injecting arbitrary strings into logs.
  The ID is attached to the request, sent back on the response, and stored in
  AsyncLocalStorage so that every log emitted while handling the request is
  automatically tagged with it.
*/
const correlationId = (req, res, next) => {
  const incomingId = req.headers[CORRELATION_HEADER] || req.headers['x-request-id'];
  const id = isValidUUID(incomingId) ? incomingId : randomUUID();

  req.correlationId = id;
  res.setHeader('X-Correlation-Id', id);

  correlationStorage.run({ correlationId: id }, () => {
    const startedAt = Date.now();
    logger.info(`→ ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
      const duration = Date.now() - startedAt;
      logger.info(`← ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
  });
};

module.exports = correlationId;
