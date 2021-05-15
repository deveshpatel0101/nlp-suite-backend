const router = require('express').Router();
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const auth = require('../middleware/auth');
const { updateProfileSchema } = require('../validators/profile');

router.patch('/', auth, async (req, res) => {
  // get data from request body
  const toUpdate = req.body;

  // validate request data
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
  } else if (
    toUpdate.oldPassword &&
    toUpdate.oldPassword === toUpdate.newPassword
  ) {
    return res.status(400).json({
      error: true,
      errorType: 'newPassword',
      errorMessage: 'New password should not be same as old password.',
    });
  }

  const dbUser = req.dbUser;

  // check the field to update
  const storeInDb = {};
  if (toUpdate.fname) {
    storeInDb.fname = toUpdate.fname;
  }
  if (toUpdate.lname) {
    storeInDb.lname = toUpdate.lname;
  }
  if (toUpdate.oldPassword) {
    // validate the old password
    const isPasswordCorrect = bcrypt.compareSync(
      toUpdate.oldPassword,
      dbUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({
        error: true,
        errorType: 'oldPassword',
        errorMessage: 'Wrong password.',
      });
    }

    const newHashPassword = bcrypt.hashSync(
      toUpdate.newPassword,
      bcrypt.genSaltSync(10)
    );
    storeInDb.password = newHashPassword;
  }

  // update the user data
  const newUser = await User.findOneAndUpdate(
    { uid: req.user.uid },
    { ...storeInDb },
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
    successMessage: 'Profile updated successfully.',
  });
});

module.exports = router;
