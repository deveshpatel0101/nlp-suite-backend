const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This schema won't validate fields properly. Make use of Joi for that before validating using this schema.
let UserSchema = new Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    required: true,
  },
  accountType: {
    type: String,
    required: true,
  },
  projects: {
    type: Array,
    required: true,
  },
});

module.exports = mongoose.model('nlp-users', UserSchema);
