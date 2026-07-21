const EMAIL_SEND_EVENT = 'email_send';

const normalizeValue = (value, fallback = 'unknown') => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return value.toString();
};

const buildLogPayload = ({ entityType, entityId, emailType, outcome, error, providerMessageId }) => {
  const payload = {
    event: EMAIL_SEND_EVENT,
    timestamp: new Date().toISOString(),
    entityType: normalizeValue(entityType),
    entityId: normalizeValue(entityId),
    emailType: normalizeValue(emailType),
    outcome,
  };

  if (providerMessageId) {
    payload.providerMessageId = providerMessageId;
  }

  if (error) {
    payload.errorName = error.name;
    payload.errorMessage = error.message;
  }

  return payload;
};

const writeEmailLog = (payload, level = 'info') => {
  const logLine = `[email-send] ${JSON.stringify(payload)}`;

  if (level === 'error') {
    console.error(logLine);
    return;
  }

  console.info(logLine);
};

const logEmailSendAttempt = (context) => {
  writeEmailLog(buildLogPayload({ ...context, outcome: 'attempted' }));
};

const logEmailSendOutcome = (context) => {
  const isFailure = context.outcome === 'failed';
  writeEmailLog(buildLogPayload(context), isFailure ? 'error' : 'info');
};

module.exports = {
  logEmailSendAttempt,
  logEmailSendOutcome,
};