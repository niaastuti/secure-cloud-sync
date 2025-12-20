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
  rsaWrapKey
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

    // simpan metadata
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
      version: 1
    };

    fs.writeFileSync(
      path.join(META_DIR, `${fileId}.json`),
      JSON.stringify(meta, null, 2)
    );

    return res.json({
      message: "File uploaded & encrypted successfully",
      fileId,
      info: { version: 1 }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Upload encrypt failed", detail: e.message });
  }
});

module.exports = router;
