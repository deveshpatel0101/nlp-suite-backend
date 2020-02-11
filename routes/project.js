const router = require('express').Router();

router.get('/', (req, res) => {
  return res.status(200).json({
    msg: 'get: /user/project',
  });
});

router.post('/', (req, res) => {
  return res.status(200).json({
    msg: 'post: /user/project',
  });
});

router.put('/', (req, res) => {
  return res.status(200).json({
    msg: 'put: /user/project',
  });
});

router.delete('/', (req, res) => {
  return res.status(200).json({
    msg: 'delete: /user/project',
  });
});

module.exports = router;
