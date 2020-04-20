const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const uuid = require('uuid/v4');
const User = require('../models/user.js');
const sendMail = require('../controllers/mail');
const { resetPasswordLinkSchema, resetPasswordSchema } = require('../validators/resetPassword');

router.post('/', (req, res) => {
  const validate = resetPasswordLinkSchema.validate(req.body);
  if (validate.error) {
    return res.status(400).json({
      error: true,
      errorType: validate.error.details[0].path[0],
      errorMessage: validate.error.details[0].message,
    });
  }

  User.findOne({ email: req.body.email })
    .then((userData) => {
      if (!userData) {
        return res.status(400).json({
          error: true,
          errorType: 'user',
          errorMessage: 'User does not exist.',
        });
      }

      const payload = {
        uid: userData.uid,
        rid: uuid(),
      };
      const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '1d' });

      sendMail({
        email: userData.email,
        subject: 'Reset password!',
        text: 'You requested to reset your password. Reset it using the following link.',
        link: `${process.env.FRONTEND_DOMAIN}/user/resetPassword?token=${token}`,
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

router.patch('/', (req, res) => {
  // validate token
  const token = req.query.token;
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      return res.status(400).json({
        error: true,
        errorType: 'token',
        errorMessage: 'Invalid reset password token!',
      });
    }

    // validate request body
    const toUpdate = req.body;
    const validate = resetPasswordSchema.validate(toUpdate);
    if (validate.error) {
      if (validate.error.details[0].path[0] === 'password') {
        return res.status(400).json({
          error: true,
          errorType: validate.error.details[0].path[0],
          errorMessage:
            'Old Password is required and should be at least 6 characters long and should include at least one uppercase letter and a number.',
        });
      } else if (validate.error.details[0].path[0] === 'confirmPassword') {
        return res.status(400).json({
          error: true,
          errorType: validate.error.details[0].path[0],
          errorMessage: 'Both passwords should match.',
        });
      }
      return res.status(400).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage: validate.error.details[0].message,
      });
    }

    User.findOne({ uid: decoded.uid })
      .then((userData) => {
        if (!userData) {
          return res.status(400).json({
            error: true,
            errorType: 'user',
            errorMessage: 'User does not exist.',
          });
        }

        // check if new password is same as old password
        const isPasswordCorrect = bcrypt.compareSync(toUpdate.password, userData.password);
        if (isPasswordCorrect) {
          return res.status(400).json({
            error: true,
            errorType: 'password',
            errorMessage: 'New password cannot be same as old password.',
          });
        }

        // hash the password
        const newHashPassword = bcrypt.hashSync(toUpdate.password, bcrypt.genSaltSync(10));
        toUpdate.password = newHashPassword;

        User.findOneAndUpdate(
          { uid: decoded.uid },
          { password: toUpdate.password },
          { new: true },
        ).then((updated) => {
          if (!updated) {
            return res.status(400).json({
              error: true,
              errorType: 'user',
              errorMessage: 'User does not exist.',
            });
          }
          return res.status(200).json({
            error: false,
            successMessage: 'Password updated successfully.',
          });
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
});

module.exports = router;
