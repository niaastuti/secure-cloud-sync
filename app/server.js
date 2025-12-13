const express = require('express');
const app = express();

// Import routes
const uploadRoutes = require('../routes/upload');
const downloadRoutes = require('../routes/download');
const updateRoutes = require('../routes/update');
const versionRoutes = require('../routes/versions');
const listRoutes = require('../routes/list');

// Middleware
app.use(express.json());

// Routes
app.use('/upload', uploadRoutes);
app.use('/download', downloadRoutes);
app.use('/update', updateRoutes);
app.use('/versions', versionRoutes);
app.use('/files', listRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Secure Cloud Sync API', 
    status: 'Running',
    endpoints: [
      'POST /upload',
      'GET  /download/:id',
      'POST /update/:id',
      'GET  /versions/:id'
    ]
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});