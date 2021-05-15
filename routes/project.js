const router = require('express').Router();
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const auth = require('../middleware/auth');
const {
  createProjectSchema,
  deleteProjectSchema,
} = require('../validators/project');

router.get('/', auth, async (req, res) => {
  const dbUser = req.dbUser;
  if (!dbUser) {
    return res.status(400).json({
      error: true,
      errorType: 'user',
      errorMessage: 'User does not exist.',
    });
  }

  const projects = dbUser.projects;
  for (let i = 0; i < projects.length; i++) {
    delete projects[i].secretToken;
    delete projects[i].requests;
  }

  return res.status(200).json({
    error: false,
    results: {
      projects,
      userData: {
        fname: dbUser.fname,
        lname: dbUser.lname,
        accountType: dbUser.accountType,
        isVerified: dbUser.isVerified,
      },
    },
  });
});

router.post('/', auth, async (req, res) => {
  // get request data from body
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

  // get the user object from database as set by auth middleware on request
  const dbUser = req.dbUser;

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

  let updatedUserObject = await User.findOneAndUpdate(
    { uid: dbUser.uid },
    { $push: { projects: data } },
    { new: true }
  );

  if (!updatedUserObject) {
    return res.status(500).json({
      error: true,
      errorType: 'server',
      errorMessage: 'Something went wrong from our side.',
    });
  }

  updatedUserObject = [...updatedUserObject.projects];
  for (let i = 0; i < updatedUserObject.length; i++) {
    delete updatedUserObject[i].secretToken;
    delete updatedUserObject[i].requests;
  }

  return res.status(200).json({
    error: false,
    results: {
      projects: updatedUserObject,
    },
  });
});

router.delete('/', auth, async (req, res) => {
  // get request data from body and validate it
  const result = deleteProjectSchema.validate(req.body);
  if (result.error) {
    return res.status(403).json({
      error: true,
      errorType: result.error.details[0].path[0],
      errorMessage: result.error.details[0].message,
    });
  }

  // get the user object from database as set by auth middleware on request
  const dbUser = req.dbUser;

  const projectToDelete = req.body.name;

  // store the project that needs to be deleted
  let deletedProject = {};
  for (let i = 0; i < dbUser.projects.length; i++) {
    if (dbUser.projects[i].name === projectToDelete) {
      deletedProject = dbUser.projects[i];
      break;
    }
  }

  // update the database
  const updatedUserObject = await User.findOneAndUpdate(
    { uid: req.user.uid },
    { $pull: { projects: { name: projectToDelete } } },
    { new: true }
  );
  if (!updatedUserObject) {
    return res.status(500).json({
      error: true,
      errorType: 'server',
      errorMessage: err,
    });
  }

  // delete the secret token and requests from deletedProject and existing projects
  delete deletedProject.secretToken;
  delete deletedProject.requests;
  for (let i = 0; i < updatedUserObject.projects.length; i++) {
    delete updatedUserObject.projects[i].secretToken;
    delete updatedUserObject.projects[i].requests;
  }

  // return successful message
  return res.status(200).json({
    err: false,
    deletedProject,
    updated: updatedUserObject,
  });
});

module.exports = router;
