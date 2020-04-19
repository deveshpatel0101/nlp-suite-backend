const router = require('express').Router();
const jwt = require('jsonwebtoken');

const uuid = require('uuid/v4');
const User = require('../models/user.js');
const sendMail = require('../controllers/mail');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  const token = req.query.token;
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      return res.send(
        'Invalid token or broken link. Email verification failed. Please login into your account and resend a new verification link.',
      );
    }
    User.findOneAndUpdate({ uid: decoded.uid }, { isVerified: true }, { new: true })
      .then((updated) => {
        if (!updated) {
          return res.redirect(
            `${process.env.FRONTEND_DOMAIN}/dashboard?verified=false&error=true&errorType=user`,
          );
        }
        return res.redirect(`${process.env.FRONTEND_DOMAIN}/dashboard?verified=true`);
      })
      .catch(() => {
        return res.redirect(
          `${process.env.FRONTEND_DOMAIN}/dashboard?verified=false&error=true&errorType=server`,
        );
      });
  });
});

router.post('/', auth, (req, res) => {
  User.findOne({ uid: req.user.uid })
    .then((userData) => {
      if (!userData) {
        return res.status(400).json({
          error: true,
          errorType: 'user',
          errorMessage: 'User does not exist.',
        });
      }
      if (userData.isVerified) {
        return res.status(400).json({
          error: true,
          errorType: 'email',
          errorMessage: 'Email is already verified.',
        });
      }

      const payload = {
        uid: req.user.uid,
        rid: uuid(),
      };
      const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '1d' });

      sendMail({
        email: userData.email,
        link: `${process.env.BACKEND_DOMAIN}/user/verify?token=${token}`,
      });

      return res.status(200).json({
        error: false,
        successMessage: 'Email sent successfully. Check your inbox!',
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: true,
        errorType: 'server',
        errorMessage: err,
      });
    });
});

module.exports = router;
