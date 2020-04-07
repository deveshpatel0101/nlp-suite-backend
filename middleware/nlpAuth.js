const jwt = require('jsonwebtoken');

const User = require('../models/user');

module.exports = function (req, res, next) {
  if (!req.get('Authorization')) {
    return res.status(401).json({
      error: true,
      errorType: 'token',
      errorMessage: 'Access Denied. No token provided.',
    });
  }
  jwt.verify(req.get('Authorization'), process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: true,
        errorType: 'token',
        errorMessage: 'Invalid token.',
      });
    }
    req.user = decoded;

    User.findOne({ uid: req.user.uid })
      .then((user) => {
        if (!user) {
          return res.status(400).json({
            error: true,
            errorType: 'user',
            errorMessage: 'User does not exist.',
          });
        }
        let flag = 0;
        for (let project = 0; project < user.projects.length; project++) {
          if (
            user.projects[project].pid === req.user.pid &&
            user.projects[project].allowedApis.includes(req.originalUrl.split('/')[2])
          ) {
            flag = 1;
            break;
          }
        }
        if (!flag) {
          return res.status(403).json({
            error: true,
            errorType: 'token',
            errorMessage: 'Invalid secret token...',
          });
        }
        req.dbUser = user;
        next();
      })
      .catch((err) => {
        return res.status(500).json({
          error: true,
          errorType: 'server',
          errorMessage: err,
        });
      });
  });
};
