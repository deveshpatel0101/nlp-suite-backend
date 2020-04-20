const Joi = require('@hapi/joi');

module.exports.resetPasswordLinkSchema = Joi.object({
  email: Joi.string().email().required(),
});

module.exports.resetPasswordSchema = Joi.object({
  password: Joi.string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{4,}$/)
    .required(),
  confirmPassword: Joi.equal(Joi.ref('password')).required(),
});
