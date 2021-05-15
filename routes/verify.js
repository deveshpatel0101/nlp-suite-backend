const router = require('express').Router();
const jwt = require('jsonwebtoken');

const uuid = require('uuid/v4');
const User = require('../models/user.js');
const sendMail = require('../controllers/mail');
const auth = require('../middleware/auth');

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
  sendMail({
    email: dbUser.email,
    subject: 'Verify your email!',
    text: 'This link will expire in 1 hour. Please verify it.',
    link: `${process.env.FRONTEND_DOMAIN}/user/verify?token=${token}`,
  });

  // return successful message
  return res.status(200).json({
    error: false,
    successMessage: 'Email sent successfully. Check your inbox!',
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
