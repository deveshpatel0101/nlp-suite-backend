const jwt = require('jsonwebtoken');

const User = require('../models/user');
const rateLimiter = require('../controllers/rateLimiter');

module.exports = async (req, res, next) => {
  const requestType = req.originalUrl.split('/')[2].toLowerCase();
  if (!req.get('Authorization')) {
    return res.status(401).json({
      error: true,
      errorType: 'token',
      errorMessage: 'Access Denied. No token provided.',
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(req.get('Authorization'), process.env.JWT_KEY);
  } catch (err) {
    return res.status(401).json({
      error: true,
      errorType: 'token',
      errorMessage: 'Invalid token.',
    });
  }

  req.user = decodedToken;

  const dbUser = await User.findOne({ uid: req.user.uid });
  if (!dbUser) {
    return res.status(404).json({
      error: true,
      errorType: 'user',
      errorMessage: 'User does not exist.',
    });
  }

  // remove secret tokens and requests associated with each projects
  for (let i = 0; i < dbUser.projects.length; i++) {
    delete dbUser.projects[i].secretToken;
    delete dbUser.projects[i].requests;
  }
  req.dbUser = dbUser;

  // check if project associated with token exists and the requested method is allowed
  let isMethodAllowed = false;
  for (let project = 0; project < dbUser.projects.length; project++) {
    if (
      dbUser.projects[project].pid === req.user.pid &&
      dbUser.projects[project].allowedApis.includes(requestType)
    ) {
      isMethodAllowed = true;
      break;
    }
  }
  if (!isMethodAllowed) {
    return res.status(403).json({
      error: true,
      errorType: 'token',
      errorMessage:
        'Either the token is invalid or the method is not allowed on the token.',
    });
  }

  let userLimit;
  try {
    userLimit = await rateLimiter(
      decodedToken.uid,
      decodedToken.pid,
      requestType
    );
  } catch (ex) {
    return res.status(500).json({
      error: true,
      errorType: 'server',
      errorMessage: ex,
    });
  }

  if (!userLimit?.shouldProceedRequest) {
    return res.status(429).json({
      error: true,
      errorType: 'rateLimit',
      errorMessage:
        'You have exceeded the limit of 100 requests per day. Subscribe to premium account or try again the next day. This limit resets everyday.',
    });
  }

  delete userLimit.shouldProceedRequest;

  req.userLimit = { ...userLimit };

  next();
};
