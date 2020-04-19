const router = require('express').Router();
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const auth = require('../middleware/auth');
const { createProjectSchema, deleteProjectSchema } = require('../validators/project');

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
            isVerified: response.isVerified,
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

  const result = createProjectSchema.validate(data);
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

    if (dbUser.isVerified === false) {
      return res.status(400).json({
        error: true,
        errorType: 'email',
        errorMessage: 'Please verify your email first!',
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

        return res.status(200).json({
          error: false,
          results: {
            projects: updated,
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
});

router.put('/', (req, res) => {
  return res.status(200).json({
    msg: 'put: /user/project',
  });
});

router.delete('/', auth, (req, res) => {
  const result = deleteProjectSchema.validate(req.body);
  if (result.error) {
    return res.status(403).json({
      error: true,
      errorType: result.error.details[0].path[0],
      errorMessage: result.error.details[0].message,
    });
  }

  const projectToDelete = req.body.name;
  User.findOne({ uid: req.user.uid }).then((dbUser) => {
    if (!dbUser) {
      return res.status(400).json({
        error: true,
        errorType: 'user',
        errorMessage: 'User does not exist.',
      });
    }
    let deletedProject = {};
    for (let i = 0; i < dbUser.projects.length; i++) {
      if (dbUser.projects[i].name === projectToDelete) {
        deletedProject = dbUser.projects[i];
        break;
      }
    }
    User.findOneAndUpdate(
      { uid: req.user.uid },
      { $pull: { projects: { name: projectToDelete } } },
      { new: true },
    )
      .then((afterUpdate) => {
        if (!afterUpdate) {
          return res.status(500).json({
            error: true,
            errorType: 'server',
            errorMessage: err,
          });
        }

        delete deletedProject.secretToken;

        for (let i = 0; i < afterUpdate.projects.length; i++) {
          delete afterUpdate.projects[i].secretToken;
          delete afterUpdate.projects[i].requests;
        }

        return res.status(200).json({
          err: false,
          deletedProject,
          updated: afterUpdate,
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

module.exports = router;
