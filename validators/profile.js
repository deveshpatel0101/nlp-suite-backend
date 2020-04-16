const Joi = require('@hapi/joi');

module.exports.updateProfileSchema = Joi.object({
  fname: Joi.string().min(3),
  lname: Joi.string().min(3),
  oldPassword: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{4,}$/),
  newPassword: Joi.string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{4,}$/)
    .when('oldPassword', {
      is: Joi.exist(),
      then: Joi.string()
        .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{4,}$/)
        .required(),
      otherwise: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{4,}$/),
    }),
  cnewPassword: Joi.equal(Joi.ref('newPassword')).when('oldPassword', {
    is: Joi.exist(),
    then: Joi.equal(Joi.ref('newPassword')).required(),
    otherwise: Joi.equal(Joi.ref('newPassword')),
  }),
});
