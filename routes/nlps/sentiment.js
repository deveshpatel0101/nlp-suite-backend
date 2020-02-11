const router = require('express').Router();

router.post('/', (req, res) => {
  return res.status(200).json({
    msg: 'post: nlp/sentiment',
  });
});

module.exports = router;
