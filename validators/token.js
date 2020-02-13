const Joi = require('@hapi/joi');

module.exports.getTokenSchema = Joi.object({
  name: Joi.string().required(),
});
