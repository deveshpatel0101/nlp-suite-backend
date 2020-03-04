const Joi = require('@hapi/joi');

module.exports.getUsageSchema = Joi.object({
  name: Joi.string().required(),
});
