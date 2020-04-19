const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const auth = require('../middleware/auth');
const { updateProfileSchema } = require('../validators/profile');

router.patch('/', auth, (req, res) => {
  const toUpdate = req.body;
  const validate = updateProfileSchema.validate(toUpdate);
  if (validate.error) {
    if (validate.error.details[0].path[0] === 'oldPassword') {
      return res.status(400).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage:
          'Old Password is required and should be at least 6 characters long and should include at least one uppercase letter and a number.',
      });
    } else if (validate.error.details[0].path[0] === 'confirmNewPassword') {
      return res.status(400).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage: 'Both new passwords should match.',
      });
    }
    return res.status(400).json({
      error: true,
      errorType: validate.error.details[0].path[0],
      errorMessage: validate.error.details[0].message,
    });
  } else if (toUpdate.oldPassword && toUpdate.oldPassword === toUpdate.newPassword) {
    return res.status(400).json({
      error: true,
      errorType: 'newPassword',
      errorMessage: 'New password should not be same as old password.',
    });
  }

  User.findOne({ uid: req.user.uid })
    .then((userData) => {
      if (!userData) {
        return res.status(400).json({
          error: true,
          errorType: 'user',
          errorMessage: 'User does not exist.',
        });
      }

      const storeInDb = {};
      if (toUpdate.fname) {
        storeInDb.fname = toUpdate.fname;
      }
      if (toUpdate.lname) {
        storeInDb.lname = toUpdate.lname;
      }

      if (toUpdate.oldPassword) {
        const isPasswordCorrect = bcrypt.compareSync(toUpdate.oldPassword, userData.password);
        if (!isPasswordCorrect) {
          return res.status(400).json({
            error: true,
            errorType: 'oldPassword',
            errorMessage: 'Wrong password.',
          });
        }
        const newHashPassword = bcrypt.hashSync(toUpdate.newPassword, bcrypt.genSaltSync(10));
        storeInDb.password = newHashPassword;
      }
      User.findOneAndUpdate({ uid: req.user.uid }, { ...storeInDb }, { new: true }).then(
        (updated) => {
          if (!updated) {
            return res.status(400).json({
              error: true,
              errorType: 'user',
              errorMessage: 'User does not exist.',
            });
          }
          return res.status(200).json({
            error: false,
            successMessage: 'Profile updated successfully.',
          });
        },
      );
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
