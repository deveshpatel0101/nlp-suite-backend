const router = require('express').Router();
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { loginUserSchema } = require('../validators/login');
const User = require('../models/user');

router.post('/', (req, res) => {
  const loginUser = req.body;
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

  User.findOne({ email: loginUser.email })
    .then((result) => {
      if (!result) {
        return res.status(400).json({
          error: true,
          errorType: 'email',
          errorMessage: 'Invalid email.',
        });
      }
      bcrypt.compare(loginUser.password, result.password, (err, isPasswordCorrect) => {
        if (err) {
          return res.status(500).json({
            error: true,
            errorType: 'unexpected',
            errorMessage: err,
          });
        } else if (!isPasswordCorrect) {
          return res.status(400).json({
            error: true,
            errorType: 'password',
            errorMessage: 'Wrong password.',
          });
        }

        const jwtPayload = {
          uid: result.uid,
          rid: uuid(),
        };
        const jwtToken = jwt.sign(jwtPayload, process.env.JWT_KEY, {
          expiresIn: '1h',
        });

        for (let i = 0; i < result.projects.length; i++) {
          delete result.projects[i].secretToken;
          delete result.projects[i].requests;
        }

        return res.status(200).json({
          error: false,
          jwtToken,
          results: {
            userData: {
              fname: result.fname,
              lname: result.lname,
              isVerified: result.isVerified,
              accountType: result.accountType,
            },
            projects: result.projects,
          },
        });
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

module.exports = router;
