const User = require('../models/user');

const pushToDb = (uid, pid, apiType, data) => {
  User.findOne({ uid })
    .then((user) => {
      if (user) {
        const projects = user.projects;
        for (let project = 0; project < projects.length; project++) {
          if (projects[project].pid === pid) {
            const arr = projects[project].requests[apiType];
            arr.push(...data);
            User.findOneAndUpdate({ uid }, { $set: { projects } }).then((res) => {
              return true;
            });
          }
        }
      }
      return false
    })
    .catch((err) => {
      return false;
    });
};

module.exports.pushToDb = pushToDb;
