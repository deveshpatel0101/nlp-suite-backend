const router = require('express').Router();
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const auth = require('../middleware/auth');
const { createProjectShcema } = require('../validators/project');

router.get('/', auth, (req, res) => {
  User.findOne({ uid: req.user.uid })
    .then((response) => {
      if (!response) {
        return res.status(400).json({
          error: true,
          errorType: 'user',
          errorMessage: 'User does not exist.',
        });
      }
      const projects = response.projects;
      for (let i = 0; i < projects.length; i++) {
        delete projects[i].secretToken;
        delete projects[i].requests;
      }
      return res.status(200).json({
        error: false,
        results: {
          projects,
          userData: {
            fname: response.fname,
            lname: response.lname,
            accountType: response.accountType,
          },
        },
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: true,
        errorType: 'server',
        errorMessage: err,
      });
    });
});

router.post('/', auth, (req, res) => {
  const data = req.body;
  data.requests = {};
  // initialize empty requests array for each allowed apis
  for (let i = 0; i < data.allowedApis.length; i++) {
    data.requests[data.allowedApis[i]] = [];
  }
  data.pid = uuid();
  const payload = {
    uid: req.user.uid,
    rid: uuid(),
    pid: data.pid,
  };
  data.secretToken = jwt.sign(payload, process.env.JWT_KEY);
  data.createdAt = new Date().getTime();

  const result = createProjectShcema.validate(data);
  if (result.error) {
    return res.status(403).json({
      error: true,
      errorType: result.error.details[0].path[0],
      errorMessage: result.error.details[0].message,
    });
  }

  User.findOne({ uid: req.user.uid }).then((dbUser) => {
    if (!dbUser) {
      return res.status(400).json({
        error: true,
        errorType: 'user',
        errorMessage: 'User does not exist.',
      });
    }

    if (dbUser.accountType === 'free' && dbUser.projects.length === 3) {
      return res.status(400).json({
        error: true,
        errorType: 'projects',
        errorMessage:
          'You have reached maximum limit of projects you can create. Subscribe to premium and create unlimited projects.',
      });
    }

    for (let i = 0; i < dbUser.projects.length; i++) {
      if (data.name === dbUser.projects[i].name) {
        return res.status(400).json({
          error: true,
          errorType: 'name',
          errorMessage: 'Application with the similar name already exist.',
        });
      }
    }

    User.findOneAndUpdate({ uid: dbUser.uid }, { $push: { projects: data } }, { new: true })
      .then((updated) => {
        if (!updated) {
          return res.status(500).json({
            error: true,
            errorType: 'server',
            errorMessage: 'Something went wrong from our side.',
          });
        }

        updated = [...updated.projects];
        for (let i = 0; i < updated.length; i++) {
          delete updated[i].secretToken;
        }

        return res.status(400).json({
          error: false,
          projects: updated,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          error: true,
          errorType: 'server',
          errorMessage: err,
        });
      });
  });
});

router.put('/', (req, res) => {
  return res.status(200).json({
    msg: 'put: /user/project',
  });
});

router.delete('/', (req, res) => {
  return res.status(200).json({
    msg: 'delete: /user/project',
  });
});

module.exports = router;
