const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This schema won't validate fields properly. Make use of Joi for that before validating using this schema.
let RateLimitSchema = new Schema({
  pid: {
    type: String,
    required: true,
  },
  firstRequest: {
    type: Number,
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
  uid: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('nlp-rate-limit', RateLimitSchema);
