const router = require('express').Router();
const bcrypt = require('bcryptjs');

const { registerUserSchema } = require('../validators/register');
const User = require('../models/user.js');

router.post('/', (req, res) => {
  const regUser = { ...req.body, accountType: 'free', applications: [] };
  const validate = registerUserSchema.validate(regUser);
  if (validate.error) {
    if (validate.error.details[0].path[0] === 'password') {
      return res.status(400).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage:
          'Password is required and should be at least 6 characters long and should include at least one uppercase letter and a number.',
      });
    } else if (validate.error.details[0].path[0] === 'cpassword') {
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

  User.findOne({ email: regUser.email }).then((result) => {
    if (result) {
      return res.status(400).json({
        error: true,
        errorType: 'email',
        errorMessage: 'User already exist.',
      });
    }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return res.status(400).json({
          error: true,
          errorType: 'unexpected',
          errorMessage: err,
        });
      }

      bcrypt.hash(regUser.password, salt, (err, hash) => {
        if (err) {
          return res.status(500).json({
            error: true,
            errorType: 'unexpected',
            errorMessage: err,
          });
        }

        regUser.password = hash;
        new User(regUser)
          .save()
          .then(() => {
            return res.status(200).json({
              error: false,
              successMessage: 'User created successfully. You can now login.',
            });
          })
          .catch((err) => {
            return res.status(500).json({
              error: true,
              errorType: 'unexpected',
              errorMessage: err,
            });
          });
      });
    });
  });
});

module.exports = router;
