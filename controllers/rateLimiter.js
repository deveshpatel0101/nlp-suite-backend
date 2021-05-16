const moment = require('moment');

const RateLimit = require('../models/rateLimit');
const User = require('../models/user');

module.exports = async (uid, pid, requestType) => {
  const REQUESTS_LIMIT = 100;
  let userRate = await RateLimit.findOne({ uid, pid });
  if (!userRate) {
    userRate = insertIntoRateLimitDb(uid, pid);
  }

  const currRequestDateTime = moment().unix();

  if (
    userRate.firstRequest === -1 ||
    moment.unix(userRate.firstRequest).format('DD MM YYYY') !==
      moment.unix(currRequestDateTime).format('DD MM YYYY')
  ) {
    userRate.count = 1;
    userRate.firstRequest = currRequestDateTime;

    // add currRequestDateTime to User
    await pushToUserDb(uid, pid, requestType, currRequestDateTime);

    // update user's rateLimit in RateLimit
    await updateToRateLimitDb(uid, pid, userRate.firstRequest, userRate.count);

    return {
      requestsMade: userRate.count,
      requestsRemaining: REQUESTS_LIMIT - userRate.count,
      shouldProceedRequest: true,
    };
  }

  if (userRate.count === REQUESTS_LIMIT) {
    return {
      requestsMade: userRate.count,
      requestsRemaining: REQUESTS_LIMIT - userRate.count,
      shouldProceedRequest: false,
    };
  }

  userRate.count += 1;

  // add currRequestDateTime to User
  await pushToUserDb(uid, pid, requestType, currRequestDateTime);

  // update user's rateLimit in RateLimit
  await updateToRateLimitDb(uid, pid, userRate.firstRequest, userRate.count);

  return {
    requestsMade: userRate.count,
    requestsRemaining: REQUESTS_LIMIT - userRate.count,
    shouldProceedRequest: true,
  };
};

const pushToUserDb = async (uid, pid, requestType, datetime) => {
  const pushPath = `projects.$.requests.${requestType.toLowerCase()}`;
  const pushObject = {};
  pushObject[pushPath] = datetime;

  const updatedUserObject = await User.findOneAndUpdate(
    { uid, 'projects.pid': pid },
    { $push: pushObject },
    { new: true }
  );
  if (!updatedUserObject) {
    throw new Error('Requested user does not exist');
  }
};

const updateToRateLimitDb = async (uid, pid, firstRequest, count) => {
  const updatedRateLimitObject = await RateLimit.findOneAndUpdate(
    { uid, pid },
    { $set: { firstRequest, count } },
    { new: true }
  );
  if (!updatedRateLimitObject) {
    throw new Error('Failed to update the cached record for rate limiting');
  }
};

const insertIntoRateLimitDb = async (uid, pid) => {
  const userRateToSave = {
    uid,
    pid,
    firstRequest: -1,
    count: 0,
  };
  const newUserRate = await new RateLimit(userRateToSave).save();
  if (!newUserRate) {
    throw new Error('Failed to cache the record for rate limiting');
  }
  return newUserRate;
};
