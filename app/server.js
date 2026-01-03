const express = require('express');
const app = express();

console.log('🔄 Loading sync routes...');
try {
  const syncRoutes = require('../routes/sync');
  const updateRoutes = require('../routes/update');
  const versionsRoutes = require('../routes/versions');
  const keysRoutes = require('../routes/keys');
  const hybridRoutes = require('../routes/hybrid');

  console.log('✅ Route modules loaded');

  app.use(express.json());

  // Register Routes
  app.use('/sync', syncRoutes);
  app.use('/update', updateRoutes);
  app.use('/versions', versionsRoutes);
  app.use('/keys', keysRoutes);
  app.use('/hybrid', hybridRoutes);

  console.log('✅ All routes registered:');
  console.log('   /sync     (check, upload, download)');
  console.log('   /update   (POST /:fileId)');
  console.log('   /versions (GET /:fileId)');
  console.log('   /keys     (POST /generate)');
  console.log('   /hybrid   (POST /encrypt, POST /decrypt)');

} catch (error) {
  console.error('❌ ERROR loading routes:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}

app.get('/', (req, res) => {
  res.json({
    message: 'Secure Cloud Sync API - Week 3 (Full Features)',
    status: 'Running',
    endpoints: {
      sync: '/sync',
      update: '/update/:fileId',
      versions: '/versions/:fileId',
      keys: '/keys/generate',
      hybrid: '/hybrid'
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});