const express = require('express');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Setup penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './storage/files';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Endpoint upload
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileInfo = {
    id: req.file.filename,
    name: req.file.originalname,
    size: req.file.size,
    uploadedAt: new Date().toISOString(),
    version: 1
  };

  res.json({
    message: 'File uploaded successfully',
    fileId: req.file.filename,
    info: fileInfo
  });
});

module.exports = router;