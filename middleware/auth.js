const jwt = require('jsonwebtoken');

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
    next();
  });
};
