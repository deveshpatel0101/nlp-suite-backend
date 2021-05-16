const router = require('express').Router();
const jwt = require('jsonwebtoken');

const uuid = require('uuid/v4');
const User = require('../models/user.js');
const sendMail = require('../controllers/mail');
const auth = require('../middleware/auth');
const logger = require('../startup/logging.js');

router.post('/', auth, async (req, res) => {
  // get the user object from database as set by auth middleware on request
  const dbUser = req.dbUser;

  // check if user is verified
  if (dbUser.isVerified) {
    return res.status(400).json({
      error: true,
      errorType: 'email',
      errorMessage: 'Email is already verified.',
    });
  }

  // generate a jwt token
  const payload = {
    uid: req.user.uid,
    rid: uuid(),
  };
  const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '1h' });

  // send an email with verification link
  try {
    await sendMail({
      email: dbUser.email,
      subject: 'Verify your email!',
      html: `Please use the following link to verify your email within 1 hour before it expires. <a href="${process.env.FRONTEND_DOMAIN}/user/verify?token=${token}" title="Email verification link">${process.env.FRONTEND_DOMAIN}/user/verify?token=${token}</a>`,
    });
  } catch (ex) {
    logger.error(
      `Failed to send email verification link to ${dbUser.email}.`,
      ex
    );
  }

  // return successful message
  return res.status(200).json({
    error: false,
    successMessage: `Email has been sent. Please check your inbox! If you didn't receive one, please try again.`,
  });
});

router.patch('/', async (req, res) => {
  // get the token string from the url
  const token = req.query.token;

  // verify the token
  let decodedToken = undefined;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    return res.status(400).json({
      error: true,
      errorType: 'token',
      errorMessage:
        'Invalid token or broken link. Email verification failed. Please login into your account and resend a new verification link.',
    });
  }

  // update the user's verified status to true
  const newUser = await User.findOneAndUpdate(
    { uid: decodedToken.uid },
    { isVerified: true },
    { new: true }
  );
  if (!newUser) {
    return res.status(400).json({
      error: true,
      errorType: 'user',
      errorMessage: 'User does not exist.',
    });
  }

  // return successful message
  return res.status(200).json({
    error: false,
    successMessage: 'Email verified successfully.',
  });
});

module.exports = router;
