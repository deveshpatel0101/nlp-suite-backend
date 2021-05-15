const mongoose = require('mongoose');
const logger = require('../startup/logging');

module.exports = () => {
  let MONGODB_URL = process.env.MONGODB_URL;
  mongoose
    .connect(MONGODB_URL, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .then(() => {
      logger.info(`Connected to mongodb database...`);
    });
};
