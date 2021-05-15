const { createLogger, format, transports } = require('winston');
require('express-async-errors');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({
      filename: 'nlp-suite-backend-logs.log',
      level: 'info',
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'nlp-suite-backend-exceptions.log' })
  ]
});

// event listeners
process.on('unhandledRejection', (ex) => {
  throw ex;
});

module.exports = logger;
