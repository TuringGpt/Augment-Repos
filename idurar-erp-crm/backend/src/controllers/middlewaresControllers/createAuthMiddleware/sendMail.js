const { passwordVerfication } = require('@/emailTemplate/emailVerfication');
const { logEmailSendAttempt, logEmailSendOutcome } = require('@/utils/emailSendLogger');

const { Resend } = require('resend');

const sendMail = async ({
  email,
  name,
  link,
  idurar_app_email,
  subject = 'Verify your email | idurar',
  type = 'emailVerfication',
  emailToken,
  entityType,
  entityId,
}) => {
  const resend = new Resend(process.env.RESEND_API);
  const logContext = {
    entityType,
    entityId,
    emailType: type,
  };

  logEmailSendAttempt(logContext);

  try {
    const { data } = await resend.emails.send({
      from: idurar_app_email,
      to: email,
      subject,
      html: passwordVerfication({ name, link }),
    });

    logEmailSendOutcome({
      ...logContext,
      outcome: 'sent',
      providerMessageId: data && data.id,
    });

    return data;
  } catch (error) {
    logEmailSendOutcome({
      ...logContext,
      outcome: 'failed',
      error,
    });

    throw error;
  }
};

module.exports = sendMail;
