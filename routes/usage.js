const router = require('express').Router();

const auth = require('../middleware/auth');
const { getUsageSchema } = require('../validators/usage');

router.get('/', auth, async (req, res) => {
  // get the project name from query string
  const result = getUsageSchema.validate({ name: req.query.name });
  if (result.error) {
    return res.status(422).json({
      error: true,
      errorType: result.error.details[0].path[0],
      errorMessage: result.error.details[0].message,
    });
  }

  // get the user object from database as set by auth middleware on request
  const dbUser = req.dbUser;

  let requests;
  for (let i = 0; i < dbUser.projects.length; i++) {
    if (dbUser.projects[i].name === req.query.name) {
      requests = dbUser.projects[i].requests;
      break;
    }
  }

  if (!requests) {
    return res.status(404).json({
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
});

module.exports = router;
