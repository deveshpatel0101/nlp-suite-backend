const mongoose = require('mongoose');

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
      console.log(`Connected to Database ${MONGODB_URL}...`);
    })
    .catch((err) => {
      console.log(`Error while connecting to mongodb`, err);
    });
};
