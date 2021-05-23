const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  if (!req.get('Authorization')) {
    return res.status(401).json({
      error: true,
      errorType: 'token',
      errorMessage: 'Access Denied. No token provided.',
    });
  }

  let decodedToken = undefined;
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
  const dbUser = await User.findOne({ uid: decodedToken.uid });
  if (!dbUser) {
    return res.status(404).json({
      error: true,
      errorType: 'user',
      errorMessage: 'User does not exist.',
    });
  }

  // remove secret tokens and requests associated with each projects
  const isRequestToProjectRoute = req.originalUrl
    .toLowerCase()
    .split('/')
    .includes('project');
  if (!isRequestToProjectRoute) {
    for (let i = 0; i < dbUser.projects.length; i++) {
      delete dbUser.projects[i].secretToken;
      delete dbUser.projects[i].requests;
    }
  }

  req.dbUser = dbUser;
  next();
};
