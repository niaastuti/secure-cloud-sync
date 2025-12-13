const express = require('express');
const router = express.Router();

router.get('/:fileId', (req, res) => {
  res.json({
    message: 'Versions endpoint (basic)',
    fileId: req.params.fileId,
    versions: []
  });
});

module.exports = router;
