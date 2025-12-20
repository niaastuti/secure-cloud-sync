// routes/download.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const {
  aesGcmDecrypt,
  rsaUnwrapKey
} = require("../services/cryptoService");

const CIPHER_DIR = path.join(__dirname, "..", "storage", "cipher");
const META_DIR = path.join(__dirname, "..", "storage", "metadata");

router.get("/:fileId", (req, res) => {
  try {
    const fileId = req.params.fileId;

    const metaPath = path.join(META_DIR, `${fileId}.json`);
    if (!fs.existsSync(metaPath)) return res.status(404).json({ error: "Metadata not found" });

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

    const cipherPath = path.join(__dirname, "..", meta.cipherPath); // pakai path dari meta
    if (!fs.existsSync(cipherPath)) return res.status(404).json({ error: "Ciphertext not found" });

    const ciphertext = fs.readFileSync(cipherPath);

    const wrappedKey = Buffer.from(meta.wrappedKeyB64, "base64");
    const aesKey = rsaUnwrapKey(wrappedKey);

    const iv = Buffer.from(meta.ivB64, "base64");
    const tag = Buffer.from(meta.tagB64, "base64");

    const plaintext = aesGcmDecrypt(ciphertext, aesKey, iv, tag);

    res.setHeader("Content-Type", meta.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${meta.originalName}"`);
    return res.send(plaintext);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Download decrypt failed", detail: e.message });
  }
});

module.exports = router;
