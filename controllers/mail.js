const nodemailer = require('nodemailer');

const sendMail = (mailValues) => {
  let mail = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: process.env.SENDGRID_USERNAME,
      pass: process.env.SENDGRID_PASSWORD,
    },
  });

  let mailOptions = {
    from: 'mehacker369@gmail.com',
    to: mailValues.email,
    subject: mailValues.subject,
    text: `${mailValues.subject}\n${mailValues.link}`,
    html: `<div>
            <p>${mailValues.subject}</p>
            <a href=${mailValues.link} title='Email verification link'>${mailValues.link}</a>
          </div>`,
  };

  mail.sendMail(mailOptions, function (err) {
    if (err) {
      console.log('something went wrong while sending mail to admin', err);
    } else {
      console.log('mail sent successfully');
    }
  });
};

module.exports = sendMail;
