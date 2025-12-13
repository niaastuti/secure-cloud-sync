const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  const metadataDir = './storage/metadata';
  
  try {
    if (!fs.existsSync(metadataDir)) {
      return res.json({ 
        success: true, 
        message: 'No files yet', 
        files: [] 
      });
    }
    
    const files = fs.readdirSync(metadataDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const data = JSON.parse(
          fs.readFileSync(path.join(metadataDir, f), 'utf8')
        );
        return {
          id: data.id,
          name: data.originalName || data.name,
          size: data.size,
          uploadedAt: data.uploadedAt,
          version: data.version || 1
        };
      });
    
    res.json({
      success: true,
      count: files.length,
      files: files
    });
    
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list files' 
    });
  }
});

module.exports = router;