const router = require('express').Router();
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { loginUserSchema } = require('../validators/login');
const User = require('../models/user');

router.post('/', async (req, res) => {
  // get request data
  const loginUser = req.body;

  // validate the data
  const validate = loginUserSchema.validate(loginUser);
  if (validate.error) {
    if (validate.error.details[0].path[0] === 'password') {
      return res.status(403).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage:
          'Password is required and should be at least 6 characters long and should include at least one uppercase letter and a numeric character.',
      });
    }
    return res.status(403).json({
      error: true,
      errorType: validate.error.details[0].path[0],
      errorMessage: validate.error.details[0].message,
    });
  }

  // check if user exists
  const dbUser = await User.findOne({ email: loginUser.email });
  if (!dbUser) {
    return res.status(400).json({
      error: true,
      errorType: 'email',
      errorMessage: 'Invalid email.',
    });
  }

  // check if password is correct
  const isPasswordCorrect = bcrypt.compareSync(
    loginUser.password,
    dbUser.password
  );
  if (!isPasswordCorrect) {
    return res.status(400).json({
      error: true,
      errorType: 'password',
      errorMessage: 'Invalid password.',
    });
  }

  // sign a jwt token
  const jwtPayload = {
    uid: dbUser.uid,
    rid: uuid(),
  };
  const jwtToken = jwt.sign(jwtPayload, process.env.JWT_KEY, {
    expiresIn: '1d',
  });

  // remove secret tokens and requests associated with each projects
  for (let i = 0; i < dbUser.projects.length; i++) {
    delete dbUser.projects[i].secretToken;
    delete dbUser.projects[i].requests;
  }

  // return successful data
  return res.status(200).json({
    error: false,
    jwtToken,
    results: {
      userData: {
        fname: dbUser.fname,
        lname: dbUser.lname,
        isVerified: dbUser.isVerified,
        accountType: dbUser.accountType,
      },
      projects: dbUser.projects,
    },
  });
});

module.exports = router;
