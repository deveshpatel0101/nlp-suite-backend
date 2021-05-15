const express = require('express');
const app = express();

const logger = require('./startup/logging');

require('./startup/config')();
require('./db/mongoose')();
require('./startup/routes')(app);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  logger.info(`server started on port ${PORT}...`);
  console.log(`server started on port ${PORT}...`);
});
