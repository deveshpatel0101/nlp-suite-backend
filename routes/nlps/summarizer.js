const router = require('express').Router();

router.post('/', (req, res) => {
  return res.status(200).json({
    msg: 'post: nlp/summarizer',
  });
});

module.exports = router;
