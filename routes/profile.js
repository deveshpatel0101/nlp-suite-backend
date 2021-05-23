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
      return res.status(422).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage: 'Invalid password.',
      });
    } else if (validate.error.details[0].path[0] === 'newPassword') {
      return res.status(422).json({
        error: true,
        errorType: validate.error.details[0].path[0],
        errorMessage:
          'New Password is required and should be at least 6 characters long and should include at least one uppercase letter and a number.',
      });
    }
    return res.status(422).json({
      error: true,
      errorType: validate.error.details[0].path[0],
      errorMessage: validate.error.details[0].message,
    });
  } else if (
    toUpdate.oldPassword &&
    toUpdate.oldPassword === toUpdate.newPassword
  ) {
    return res.status(422).json({
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
      return res.status(403).json({
        error: true,
        errorType: 'oldPassword',
        errorMessage: 'Invalid password.',
      });
    }

    const newHashPassword = bcrypt.hashSync(
      toUpdate.newPassword,
      bcrypt.genSaltSync(10)
    );
    storeInDb.password = newHashPassword;
  }

  // update the user data
  const updatedUserProfile = await User.findOneAndUpdate(
    { uid: req.user.uid },
    { ...storeInDb },
    { new: true }
  );

  delete updatedUserProfile.uid;
  delete updatedUserProfile.password;
  delete updatedUserProfile.projects;

  // return successful message
  return res.status(200).json({
    error: false,
    results: {
      userData: updatedUserProfile,
    },
  });
});

module.exports = router;
