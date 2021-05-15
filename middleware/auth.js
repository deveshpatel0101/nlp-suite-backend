const jwt = require('jsonwebtoken');

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
  next();
};
