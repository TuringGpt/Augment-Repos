const { randomUUID } = require('crypto');

const { correlationStorage, logger } = require('@/utils/logger');

const CORRELATION_HEADER = 'x-correlation-id';

/*
  Correlation ID middleware

  Assigns a unique correlation ID to every incoming request (reusing an inbound
  X-Correlation-Id / X-Request-Id header when a caller already provides one, so
  the ID can be traced across services). The ID is attached to the request, sent
  back on the response, and stored in AsyncLocalStorage so that every log emitted
  while handling the request is automatically tagged with it.
*/
const correlationId = (req, res, next) => {
  const incomingId = req.headers[CORRELATION_HEADER] || req.headers['x-request-id'];
  const id = incomingId || randomUUID();

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
