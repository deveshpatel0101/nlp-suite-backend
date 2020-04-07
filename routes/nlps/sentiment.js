const router = require('express').Router();

const { pushToDb } = require('../../controllers/rateLimit');
const nlpAuth = require('../../middleware/nlpAuth');

router.post('/', nlpAuth, (req, res) => {
  pushToDb(req.user.uid, req.user.pid, 'sentiment', [new Date().getTime()]);
  return res.status(200).json({
    msg: 'post: nlp/sentiment',
  });
});

module.exports = router;
