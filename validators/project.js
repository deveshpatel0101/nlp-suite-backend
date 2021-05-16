const Joi = require('@hapi/joi');

module.exports.createProjectSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .regex(/^([-_0-9]*[a-z]+[-_0-9]*)*$/)
    .required(),
  pid: Joi.string().required(),
  allowedApis: Joi.array()
    .min(1)
    .max(2)
    .items(
      Joi.string().valid('entities', 'sentiment', 'summarizer', 'translator')
    )
    .required(),
  requests: Joi.object({
    entities: Joi.array().length(0),
    sentiment: Joi.array().length(0),
    summarizer: Joi.array().length(0),
    translator: Joi.array().length(0),
  }),
  secretToken: Joi.string().required(),
  createdAt: Joi.date().required(),
});

module.exports.deleteProjectSchema = Joi.object({
  name: Joi.string().required(),
});
