const logger = require('../startup/logging');

module.exports = (err, req, res, next) => {
  logger.error(err.message, err);

  res.status(500).json({
    error: true,
    errorType: 'server',
    errorMessage: err,
  });
};
