const Joi = require('@hapi/joi');

module.exports.registerUserSchema = Joi.object({
  uid: Joi.string().required(),
  fname: Joi.string().min(3).required(),
  lname: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{4,}$/)
    .required(),
  accountType: Joi.string().equal('free'),
  isVerified: Joi.string().equal(false),
  projects: Joi.array().length(0).required(),
});
