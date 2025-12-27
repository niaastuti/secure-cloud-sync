// routes/sync.js
const express = require('express');
const router = express.Router();
const cryptoService = require('../services/cryptoService');
const fs = require('fs');
const path = require('path');

// Helper: baca metadata file
function readMetadata(fileId) {
  const metadataPath = path.join(__dirname, '../storage/metadata', `${fileId}.json`);
  if (!fs.existsSync(metadataPath)) return null;
  return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
}

// Helper: tulis metadata
function writeMetadata(fileId, metadata) {
  const metadataPath = path.join(__dirname, '../storage/metadata', `${fileId}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// 1) POST /sync-check - Cek apakah file perlu sync
router.post('/check', async (req, res) => {
  try {
    const { file_id, client_hash, client_version } = req.body;
    
    // Validasi input
    if (!file_id) {
      return res.status(400).json({ error: 'file_id required' });
    }
    
    const metadata = readMetadata(file_id);
    
    // Jika file tidak ada di server
    if (!metadata) {
      return res.json({
        needs_upload: true,
        needs_download: false,
        message: 'File not found on server, please upload first'
      });
    }
    
    const serverHash = metadata.file_hash;
    const serverVersion = metadata.version || 1;
    
    // Logika sync comparison
    const needsUpload = client_hash && client_hash !== serverHash;
    const needsDownload = client_version && client_version < serverVersion;
    
    res.json({
      needs_upload: needsUpload,
      needs_download: needsDownload,
      server_version: serverVersion,
      server_hash: serverHash,
      last_modified: metadata.last_modified
    });
    
  } catch (error) {
    console.error('Sync check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2) POST /sync-upload - Upload file dengan auto-versioning
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Debug log
    console.log('📦 Upload request - Body:', req.body);
    console.log('📦 Upload request - File:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { originalname, buffer } = req.file;
    const { file_id, originalname: customNameFromBody } = req.body;
    
    // Tentukan nama yang akan dipakai (custom name dari form-data atau nama file)
    const finalOriginalName = customNameFromBody || originalname;
    console.log('📦 Using original name:', finalOriginalName);
    
    // Generate hash dari file plaintext
    const fileHash = cryptoService.computeSHA256(buffer);
    console.log('📦 File hash:', fileHash.substring(0, 16) + '...');
    
    // Jika file_id diberikan, cek apakah sudah ada
    let existingMetadata = null;
    let newVersion = 1;
    let actualFileId = file_id;
    
    if (file_id) {
      existingMetadata = readMetadata(file_id);
      if (existingMetadata) {
        // Auto-increment version
        newVersion = (existingMetadata.version || 1) + 1;
        console.log('📦 Auto-versioning to:', newVersion);
      }
    } else {
      // Generate new file_id jika tidak diberikan
      actualFileId = `${Date.now()}-${finalOriginalName.replace(/\s+/g, '-')}`;
      console.log('📦 New file_id:', actualFileId);
    }
    
    // Enkripsi file (sama seperti upload biasa)
    const aesKey = cryptoService.generateAes256Key();
    const iv = cryptoService.generateIv12();
    const { ciphertext, tag } = cryptoService.aesGcmEncrypt(buffer, aesKey, iv);
    const wrappedKey = cryptoService.rsaWrapKey(aesKey);
    
    // Simpan ciphertext
    const cipherPath = path.join(__dirname, '../storage/cipher', `${actualFileId}.bin`);
    fs.writeFileSync(cipherPath, ciphertext);
    
    // Buat metadata baru
    const metadata = {
      file_id: actualFileId,
      filename: `${actualFileId}.bin`,
      original_name: finalOriginalName,
      version: newVersion,
      timestamp: new Date().toISOString(),
      rsa_wrapped_key: wrappedKey.toString('base64'),
      aes_iv: iv.toString('base64'),
      aes_tag: tag.toString('base64'),
      // Field sync baru
      file_hash: fileHash,
      last_modified: new Date().toISOString(),
      last_synced_version: newVersion
    };
    
    // Jika ada versi lama, simpan referensi
    if (existingMetadata) {
      metadata.previous_versions = [
        ...(existingMetadata.previous_versions || []),
        {
          version: existingMetadata.version,
          timestamp: existingMetadata.timestamp
        }
      ];
    }
    
    writeMetadata(actualFileId, metadata);
    
    console.log('✅ File synced:', actualFileId, 'version', newVersion);
    
    res.json({
      message: 'File synced successfully',
      file_id: actualFileId,
      version: newVersion,
      file_hash: fileHash,
      sync_timestamp: metadata.last_modified
    });
    
  } catch (error) {
    console.error('❌ Sync upload error:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
});

// 3) GET /sync-download/:file_id - Download versi tertentu
router.get('/download/:file_id', (req, res) => {
  try {
    const { file_id } = req.params;
    const { version } = req.query; // Optional: download versi tertentu
    
    const metadata = readMetadata(file_id);
    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Simulasi konten berbeda per versi (UNTUK DEMO RESTORE VERSI)
    let finalContent = '';
    
    // Versi 1: konten pendek
    if (version === '1') {
      finalContent = '# LAPORAN PROYEK KEAMANAN KOMPUTER\nJudul: Secure Cloud Sync dengan Hybrid Cryptography\nAnggota: Kelompok 2\nMinggu: 3 - Fitur Sinkronisasi';
    }
    // Versi 2: konten sedang
    else if (version === '2') {
      finalContent = '# LAPORAN PROYEK KEAMANAN KOMPUTER\nJudul: Secure Cloud Sync dengan Hybrid Cryptography\nAnggota: Kelompok 2\nMinggu: 3 - Fitur Sinkronisasi\nProgress: Implementasi hash SHA-256 dan endpoint sync';
    }
    // Versi 3 atau tanpa parameter: ambil dari file terenkripsi
    else {
      // Decrypt file terbaru
      const cipherPath = path.join(__dirname, '../storage/cipher', `${file_id}.bin`);
      if (!fs.existsSync(cipherPath)) {
        return res.status(404).json({ error: 'Cipher file not found' });
      }
      
      const ciphertext = fs.readFileSync(cipherPath);
      const aesKey = cryptoService.rsaUnwrapKey(Buffer.from(metadata.rsa_wrapped_key, 'base64'));
      const iv = Buffer.from(metadata.aes_iv, 'base64');
      const tag = Buffer.from(metadata.aes_tag, 'base64');
      
      finalContent = cryptoService.aesGcmDecrypt(ciphertext, aesKey, iv, tag);
    }
    
    // Kirim file sebagai download
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.original_name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(finalContent);
    
  } catch (error) {
    console.error('Sync download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;