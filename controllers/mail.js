const sendgridMail = require('@sendgrid/mail');
const logger = require('../startup/logging');

const sendMail = async (mailValues) => {
  sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

  const message = {
    from: 'mehacker369@gmail.com',
    to: mailValues.email,
    subject: mailValues.subject,
    html: mailValues.html,
  };

  try {
    logger.info(`Sending email with values:`, message);
    const response = await sendgridMail.send(message);
    logger.info(`Received email response:`, response);

    if (!(response[0].statusCode >= 200 && response[0].statusCode <= 299)) {
      throw new Error(
        `Failed to send email. Received response with status code: ${response[0].statusCode}`
      );
    }
  } catch (ex) {
    logger.info(`Failed to send email. ${ex.message}`, ex);
    throw ex;
  }
};

module.exports = sendMail;
