const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const uuid = require('uuid/v4');
const User = require('../models/user.js');
const sendMail = require('../controllers/mail');
const {
  resetPasswordLinkSchema,
  resetPasswordSchema,
} = require('../validators/resetPassword');
const logger = require('../startup/logging.js');

router.post('/', async (req, res) => {
  // get the request body and validate the data
  const validate = resetPasswordLinkSchema.validate(req.body);
  if (validate.error) {
    return res.status(422).json({
      error: true,
      errorType: validate.error.details[0].path[0],
      errorMessage: validate.error.details[0].message,
    });
  }

  // check if user exists
  const dbUser = await User.findOne({ email: req.body.email });
  if (!dbUser) {
    return res.status(404).json({
      error: true,
      errorType: 'user',
      errorMessage: 'User does not exist.',
    });
  }

  const payload = {
    uid: dbUser.uid,
    rid: uuid(),
  };
  const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '1h' });

  try {
    await sendMail({
      email: dbUser.email,
      subject: 'Reset password!',
      html: `<p>Please use the following link to reset your password. It will expire in 1 hour.</p><a href="${process.env.FRONTEND_DOMAIN}/user/resetPassword?token=${token}" title="Email verification link">${process.env.FRONTEND_DOMAIN}/user/resetPassword?token=${token}</a>`,
    });
  } catch (ex) {
    logger.error(`Failed to send email to ${dbUser.email} for password reset`);
  }

  return res.status(200).json({
    error: false,
    successMessage: `Email has been sent. Please check your inbox! If you didn't receive one, please try again later.`,
  });
});

router.patch('/', async (req, res) => {
  // validate token
  const token = req.query.token;

  // verify the token
  let decodedToken = undefined;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    return res.status(403).json({
      error: true,
      errorType: 'token',
      errorMessage: 'Invalid token or broken link. Password reset failed.',
    });
  }

  // validate request body
  const toUpdate = req.body;
  const validate = resetPasswordSchema.validate(toUpdate);
  if (validate.error) {
    if (validate.error.details[0].path[0] === 'password') {
      return res.status(422).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage: 'Password is required and should be at least 6 characters long and should include at least one uppercase letter and a number.'
      });
    }
    return res.status(422).json({
      error: true,
      errorType: validate.error.details[0].path[0],
      errorMessage: validate.error.details[0].message,
    });
  }

  // check if user exists
  const dbUser = await User.findOne({ uid: decodedToken.uid });
  if (!dbUser) {
    return res.status(404).json({
      error: true,
      errorType: 'user',
      errorMessage: 'User does not exist.',
    });
  }

  // check if new password is same as old password
  const isPasswordCorrect = bcrypt.compareSync(
    toUpdate.password,
    dbUser.password
  );
  if (isPasswordCorrect) {
    return res.status(409).json({
      error: true,
      errorType: 'password',
      errorMessage: 'New password cannot be same as old password.',
    });
  }

  // hash the new password
  toUpdate.password = bcrypt.hashSync(
    toUpdate.password,
    bcrypt.genSaltSync(10)
  );

  // update the password in db
  await User.findOneAndUpdate(
    { uid: decodedToken.uid },
    { password: toUpdate.password },
    { new: true }
  );

  // return successful message
  return res.status(200).json({
    error: false,
    successMessage: 'Password updated successfully.',
  });
});

module.exports = router;
