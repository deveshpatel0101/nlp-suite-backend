const router = require('express').Router();

const nlpAuth = require('../../middleware/nlpAuth');

router.post('/', nlpAuth, (req, res) => {
  return res.status(200).json({
    msg: 'post: nlp/translator',
  });
});

module.exports = router;
