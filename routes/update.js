const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const {
  computeSHA256,
  generateAes256Key,
  generateIv12,
  aesGcmEncrypt,
  rsaWrapKey
} = require('../services/cryptoService');

const upload = multer({ storage: multer.memoryStorage() });

const CIPHER_DIR = path.join(__dirname, '..', 'storage', 'cipher');
const META_DIR = path.join(__dirname, '..', 'storage', 'metadata');

router.post('/:fileId', upload.single('file'), (req, res) => {
  try {
    const { fileId } = req.params;

    // 1. Cek keberadaan metadata lama
    const metaPath = path.join(META_DIR, `${fileId}.json`);
    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ error: 'File version reference not found (File ID invalid)' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded for update' });
    }

    const oldMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const plainBuffer = req.file.buffer;

    // 2. Compute New Hash
    const newFileHash = computeSHA256(plainBuffer);

    // 3. Encrypt New Content
    const t0 = performance.now();
    const aesKey = generateAes256Key();
    const iv = generateIv12();
    const { ciphertext, tag } = aesGcmEncrypt(plainBuffer, aesKey, iv);
    const t1 = performance.now();

    const wrappedKey = rsaWrapKey(aesKey);
    const t2 = performance.now();

    // 4. Overwrite Cipher File (or separate if we want full history storage, 
    // but usually cloud sync overwrites "current" and logs version)
    // To support "download old version", we should actually store old versions separately 
    // OR just updating the current head is enough for this specific requirement if we accept older versions are lost content-wise.
    // GUIDELINE data: "versi 1, versi 2, versi 3". 
    // Let's TRY to keep old cipher files if possible, BUT the requirements imply minimal storage. 
    // However, robust versioning usually keeps old blobs. 
    // For simplicity & requirement compliance (only "update file -> generate version"), 
    // I will overwrite the MAIN cipher file but store the OLD metadata state in 'previous_versions'. 
    // IF we need to restore, we would need the old cipher. 
    // Let's support KEEPING old data by renaming it? 
    // Actually, simple overwrite is standard for "Sync" unless "Backup". 
    // "Update file -> menghasilkan versi baru + log perubahan".
    // Let's stick to SIMPLE overwrite of physical file for now, but logical version increment.
    // WAIT, requirement B says "Mahasiswa harus menunjukkan 3 versi". If I overwrite, I can't download Version 1.
    // SO, I MUST RENAME/ARCHIVE the old file before overwriting.

    // Archiving old version:
    if (fs.existsSync(path.join(CIPHER_DIR, oldMeta.filename))) {
      const archiveName = `${oldMeta.file_id}_v${oldMeta.version}.bin`;
      fs.copyFileSync(
        path.join(CIPHER_DIR, oldMeta.filename),
        path.join(CIPHER_DIR, archiveName)
      );
    }

    fs.writeFileSync(path.join(CIPHER_DIR, oldMeta.filename), ciphertext);

    // 5. Update Metadata
    const newVersion = (oldMeta.version || 1) + 1;

    // Store old version info (LIGHTWEIGHT) + REFERENCE to archived file if we wanted full restore.
    // For now, let's just log the metadata change.
    const historyEntry = {
      version: oldMeta.version,
      timestamp: oldMeta.timestamp || oldMeta.last_modified,
      file_hash: oldMeta.file_hash,
      archived_file: `${oldMeta.file_id}_v${oldMeta.version}.bin` // pointer to backup
    };

    const newMeta = {
      ...oldMeta,
      version: newVersion,
      last_modified: new Date().toISOString(),
      file_hash: newFileHash,
      rsa_wrapped_key: wrappedKey.toString('base64'),
      aes_iv: iv.toString('base64'),
      aes_tag: tag.toString('base64'),
      previous_versions: [
        ...(oldMeta.previous_versions || []),
        historyEntry
      ]
    };

    fs.writeFileSync(metaPath, JSON.stringify(newMeta, null, 2));

    res.json({
      message: 'File updated successfully',
      file_id: fileId,
      new_version: newVersion,
      file_hash: newFileHash,
      file_hash: newFileHash,
      previous_version_count: newMeta.previous_versions.length,
      performance: {
        aes_encrypt_ms: +(t1 - t0).toFixed(3),
        rsa_wrap_ms: +(t2 - t1).toFixed(3),
        total_process_ms: +(t2 - t0).toFixed(3),
        ciphertext_size_bytes: ciphertext.length
      }
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Update failed', detail: error.message });
  }
});

module.exports = router;
