const router = require('express').Router();
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const User = require('../models/user');
const auth = require('../middleware/auth');
const {
  createProjectSchema,
  deleteProjectSchema,
} = require('../validators/project');

router.get('/', auth, async (req, res) => {
  const dbUser = req.dbUser;

  const projects = dbUser.projects;
  for (let i = 0; i < projects.length; i++) {
    delete projects[i].secretToken;
    delete projects[i].requests;
  }

  return res.status(200).json({
    error: false,
    results: {
      userData: {
        fname: dbUser.fname,
        lname: dbUser.lname,
        accountType: dbUser.accountType,
        isVerified: dbUser.isVerified,
        projects,
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
  data.createdAt = moment().unix();

  const result = createProjectSchema.validate(data);
  if (result.error) {
    if (result.error.details[0].path[0] === 'name') {
      return res.status(422).json({
        error: true,
        errorType: result.error.details[0].path[0],
        errorMessage:
          'Project name should have at least 3 characters, a lowercase letter and may contain numbers, hyphens or underscores. Uppercase letters are not allowed.',
      });
    }
    return res.status(422).json({
      error: true,
      errorType: result.error.details[0].path[0],
      errorMessage: result.error.details[0].message,
    });
  }

  // get the user object from database as set by auth middleware on request
  const dbUser = req.dbUser;

  if (dbUser.isVerified === false) {
    return res.status(403).json({
      error: true,
      errorType: 'email',
      errorMessage: 'Please verify your email first!',
    });
  }

  if (dbUser.accountType === 'free' && dbUser.projects.length === 3) {
    return res.status(403).json({
      error: true,
      errorType: 'projects',
      errorMessage:
        'You have reached maximum limit of projects you can create. Subscribe to premium and create unlimited projects.',
    });
  }

  for (let i = 0; i < dbUser.projects.length; i++) {
    if (data.name === dbUser.projects[i].name) {
      return res.status(422).json({
        error: true,
        errorType: 'name',
        errorMessage: 'Project with the similar name already exist.',
      });
    }
  }

  let updatedUserObject = await User.findOneAndUpdate(
    { uid: dbUser.uid },
    { $push: { projects: data } },
    { new: true }
  );

  delete data.secretToken;
  delete data.requests;
  updatedUserObject = [...updatedUserObject.projects];
  for (let i = 0; i < updatedUserObject.length; i++) {
    delete updatedUserObject[i].secretToken;
    delete updatedUserObject[i].requests;
  }

  return res.status(200).json({
    error: false,
    results: {
      projects: updatedUserObject,
      addedProject: data,
    },
  });
});

router.delete('/', auth, async (req, res) => {
  // get request data from body and validate it
  const result = deleteProjectSchema.validate(req.body);
  if (result.error) {
    return res.status(422).json({
      error: true,
      errorType: result.error.details[0].path[0],
      errorMessage: result.error.details[0].message,
    });
  }

  // get the user object from database as set by auth middleware on request
  const dbUser = req.dbUser;

  const projectToDelete = req.body.name;

  // store the project that needs to be deleted
  let removedProject = {};
  let isProjectFound = false;
  for (let i = 0; i < dbUser.projects.length; i++) {
    if (dbUser.projects[i].name === projectToDelete) {
      removedProject = dbUser.projects[i];
      isProjectFound = true;
      break;
    }
  }

  if(!isProjectFound) {
    return res.status(422).json({
      error: true,
      errorType: 'name',
      errorMessage: `Project named "${projectToDelete}" not found.`,
    });
  }

  // update the database
  const updatedUserObject = await User.findOneAndUpdate(
    { uid: req.user.uid },
    { $pull: { projects: { name: projectToDelete } } },
    { new: true }
  );

  // delete the secret token and requests from deletedProject and existing projects
  delete removedProject.secretToken;
  delete removedProject.requests;
  for (let i = 0; i < updatedUserObject.projects.length; i++) {
    delete updatedUserObject.projects[i].secretToken;
    delete updatedUserObject.projects[i].requests;
  }

  // return successful message
  return res.status(200).json({
    error: false,
    removedProject,
    projects: updatedUserObject,
  });
});

module.exports = router;
