// routes/upload.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// ambil file sebagai buffer (jangan simpan plaintext ke disk)
const upload = multer({ storage: multer.memoryStorage() });

const {
  generateAes256Key,
  generateIv12,
  aesGcmEncrypt,
  rsaWrapKey,
  computeSHA256  // ← BARU: import fungsi hash
} = require("../services/cryptoService");

const CIPHER_DIR = path.join(__dirname, "..", "storage", "cipher");
const META_DIR = path.join(__dirname, "..", "storage", "metadata");

function ensureDirs() {
  if (!fs.existsSync(CIPHER_DIR)) fs.mkdirSync(CIPHER_DIR, { recursive: true });
  if (!fs.existsSync(META_DIR)) fs.mkdirSync(META_DIR, { recursive: true });
}

router.post("/", upload.single("file"), (req, res) => {
  try {
    ensureDirs();

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const plainBuffer = req.file.buffer;

    // ======== TAMBAHAN WEEK 3: Hitung hash dari plaintext ========
    const fileHash = computeSHA256(plainBuffer);
    // ============================================================

    // AES-256-GCM
    const aesKey = generateAes256Key();
    const iv = generateIv12(); // 12 bytes
    const { ciphertext, tag } = aesGcmEncrypt(plainBuffer, aesKey, iv);

    // RSA wrap AES key
    const wrappedKey = rsaWrapKey(aesKey);

    // simpan ciphertext (BINARY)
    const fileId = `${Date.now()}-${req.file.originalname}`;
    const cipherFileName = `${fileId}.bin`;
    const cipherPath = path.join(CIPHER_DIR, cipherFileName);
    fs.writeFileSync(cipherPath, ciphertext);

    // simpan metadata (TAMBAH FIELD SYNC)
    const meta = {
      id: fileId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizePlain: req.file.size,
      cipherPath: `storage/cipher/${cipherFileName}`,
      ivB64: iv.toString("base64"),
      tagB64: tag.toString("base64"),
      wrappedKeyB64: wrappedKey.toString("base64"),
      uploadedAt: new Date().toISOString(),
      version: 1,
      // ======== FIELD BARU UNTUK SYNC WEEK 3 ========
      file_hash: fileHash,                    // Hash SHA-256 plaintext
      last_modified: new Date().toISOString(), // Timestamp terakhir modifikasi
      last_synced_version: 1,                 // Versi terakhir yang disinkronkan
      sync_metadata: {                        // Optional: grouping field sync
        hash_algorithm: "SHA-256",
        hash_value: fileHash
      }
      // ==============================================
    };

    fs.writeFileSync(
      path.join(META_DIR, `${fileId}.json`),
      JSON.stringify(meta, null, 2)
    );

    return res.json({
      message: "File uploaded & encrypted successfully",
      fileId,
      info: { 
        version: 1,
        file_hash: fileHash,      // ← Kirim juga hash di response
        last_modified: meta.last_modified
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Upload encrypt failed", detail: e.message });
  }
});

module.exports = router;