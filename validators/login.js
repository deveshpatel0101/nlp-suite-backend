const Joi = require('@hapi/joi');

module.exports.loginUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{4,}$/)
    .required(),
});
