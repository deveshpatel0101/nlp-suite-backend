const router = require('express').Router();

const User = require('../models/user');
const auth = require('../middleware/auth');
const { getUsageSchema } = require('../validators/usage');

router.get('/', auth, (req, res) => {
  const result = getUsageSchema.validate({ name: req.query.name });
  if (result.error) {
    return res.status(403).json({
      error: true,
      errorType: result.error.details[0].path[0],
      errorMessage: result.error.details[0].message,
    });
  }

  User.findOne({ uid: req.user.uid })
    .then((dbUser) => {
      if (!dbUser) {
        return res.status(400).json({
          error: true,
          errorType: 'user',
          errorMessage: 'User does not exist.',
        });
      }

      let requests;
      for (let i = 0; i < dbUser.projects.length; i++) {
        if (dbUser.projects[i].name === req.query.name) {
          requests = dbUser.projects[i].requests;
          break;
        }
      }

      if (!requests) {
        return res.status(400).json({
          error: true,
          errorType: 'project',
          errorMessage: `Project with ${req.query.name} name not found.`,
        });
      }

      return res.status(200).json({
        error: false,
        results: {
          requests,
        },
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
