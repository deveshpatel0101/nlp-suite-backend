const router = require('express').Router();

const User = require('../models/user');
const auth = require('../middleware/auth');
const { getTokenSchema } = require('../validators/token');

router.get('/', auth, async (req, res) => {
  // get the project name from query string
  const result = getTokenSchema.validate({ name: req.query.name });
  if (result.error) {
    return res.status(403).json({
      error: true,
      errorType: result.error.details[0].path[0],
      errorMessage: result.error.details[0].message,
    });
  }

  // get the user object from database as set by auth middleware on request
  const dbUser = req.dbUser;

  // find the secret token
  let secretToken = undefined;
  for (let i = 0; i < dbUser.projects.length; i++) {
    if (dbUser.projects[i].name === req.query.name) {
      secretToken = dbUser.projects[i].secretToken;
      break;
    }
  }

  if (!secretToken) {
    return res.status(400).json({
      error: true,
      errorType: 'project',
      errorMessage: `Project with ${req.query.name} name not found.`,
    });
  }

  return res.status(200).json({
    error: false,
    results: {
      secretToken,
    },
  });
});

module.exports = router;
