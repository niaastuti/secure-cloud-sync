const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const filePath = path.join(__dirname, '../storage/files', fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
});

module.exports = router;
