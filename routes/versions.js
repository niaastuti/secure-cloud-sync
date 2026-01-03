const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const META_DIR = path.join(__dirname, '..', 'storage', 'metadata');

router.get('/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const metaPath = path.join(META_DIR, `${fileId}.json`);

    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ error: 'File reference not found' });
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    // Construct history response
    const history = {
      file_id: meta.file_id,
      current_version: {
        version: meta.version,
        hash: meta.file_hash,
        modified_at: meta.last_modified
      },
      history: meta.previous_versions || []
    };

    res.json(history);

  } catch (error) {
    console.error('Versions error:', error);
    res.status(500).json({ error: 'Failed to retrieve versions' });
  }
});

module.exports = router;
