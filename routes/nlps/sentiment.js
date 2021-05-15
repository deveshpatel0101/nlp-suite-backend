const router = require('express').Router();
const fetch = require('node-fetch');

const nlpAuth = require('../../middleware/nlpAuth');

router.post('/', nlpAuth, (req, res) => {
  fetch(`${process.env.PYTHON_BACKEND_DOMAIN}/sentiment`, {
    method: 'post',
    body: JSON.stringify({ input: req.body.input }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      return res.status(200).json({
        output: data.results,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        errorMessage: err,
      });
    });
});

module.exports = router;
