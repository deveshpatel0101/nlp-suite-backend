const router = require('express').Router();
const bcrypt = require('bcryptjs');

const { registerUserSchema } = require('../validators/register');
const uuid = require('uuid/v4');
const User = require('../models/user.js');

router.post('/', async (req, res) => {
  // get request data
  const regUser = {
    ...req.body,
    accountType: 'free',
    isVerified: false,
    projects: [],
    uid: uuid(),
  };

  // validate the data
  const validate = registerUserSchema.validate(regUser);
  if (validate.error) {
    if (validate.error.details[0].path[0] === 'password') {
      return res.status(400).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage:
          'Password is required and should be at least 6 characters long and should include at least one uppercase letter and a number.',
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

  // check if user exists
  const dbUser = await User.findOne({ email: loginUser.email });
  if (dbUser) {
    return res.status(400).json({
      error: true,
      errorType: 'user',
      errorMessage: 'User already exists.',
    });
  }

  // hash the password
  const salt = bcrypt.genSaltSync(10);
  regUser.password = bcrypt.hashSync(regUser.password, salt);

  // save the user
  const newUser = await new User(regUser).save();
  if (!newUser) {
    return res.status(400).json({
      error: true,
      errorType: 'server',
      errorMessage: 'Unable to create a new user.',
    });
  }

  return res.status(200).json({
    error: false,
    successMessage: 'User created successfully. You can now login.',
  });
});

module.exports = router;
