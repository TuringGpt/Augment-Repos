const { logEmailSendAttempt, logEmailSendOutcome } = require('@/utils/emailSendLogger');

const mail = async (req, res) => {
  const logContext = {
    entityType: 'invoice',
    entityId: req.body && req.body.id,
    emailType: 'invoice',
  };

  logEmailSendAttempt(logContext);
  logEmailSendOutcome({
    ...logContext,
    outcome: 'skipped_premium_feature_required',
  });

  return res.status(200).json({
    success: true,
    result: null,
    message: 'Please Upgrade to Premium  Version to have full features',
  });
};

module.exports = mail;
