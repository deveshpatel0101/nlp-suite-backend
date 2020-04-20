const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

require('./db/mongoose')();
const login = require('./routes/login');
const profile = require('./routes/profile');
const project = require('./routes/project');
const register = require('./routes/register');
const resetPassword = require('./routes/resetPassword');
const token = require('./routes/token');
const usage = require('./routes/usage');
const verify = require('./routes/verify');

const entities = require('./routes/nlps/entities');
const sentiment = require('./routes/nlps/sentiment');
const summarizer = require('./routes/nlps/summarizer');
const translator = require('./routes/nlps/translator');

const PORT = process.env.PORT || 8000;

// enable CORS
app.use(cors());

// body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// routes
app.use('/user/login', login);
app.use('/user/profile', profile);
app.use('/user/project', project);
app.use('/user/register', register);
app.use('/user/resetPassword', resetPassword);
app.use('/user/verify', verify);
app.use('/project/token', token);
app.use('/project/usage', usage);

app.use('/nlp/entities', entities);
app.use('/nlp/sentiment', sentiment);
app.use('/nlp/summarizer', summarizer);
app.use('/nlp/translator', translator);

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}...`);
});
