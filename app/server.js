const express = require('express');
const app = express();

console.log('🔄 Loading sync routes...');
try {
  const syncRoutes = require('../routes/sync');
  console.log('✅ sync.js loaded successfully');
  
  app.use(express.json());
  app.use('/sync', syncRoutes);
  
  console.log('✅ Sync routes registered:');
  console.log('   POST /sync/check');
  console.log('   POST /sync/upload');
  console.log('   GET  /sync/download/:file_id');
  
} catch (error) {
  console.error('❌ ERROR loading sync routes:', error.message);
  console.error('Full error:', error);
  process.exit(1); // Stop server jika error
}

app.get('/', (req, res) => {
  res.json({ 
    message: 'Secure Cloud Sync API - Week 3',
    status: 'Running',
    endpoints: {
      root: 'GET /',
      sync_check: 'POST /sync/check',
      sync_upload: 'POST /sync/upload',
      sync_download: 'GET /sync/download/:file_id',
      regular_upload: 'POST /upload',
      regular_download: 'GET /download/:id'
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Root endpoint: http://localhost:${PORT}/`);
});