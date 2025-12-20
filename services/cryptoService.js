// services/cryptoService.js
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const KEY_DIR = path.join(__dirname, "..", "keys");
const PUBLIC_KEY_PATH = path.join(KEY_DIR, "public.pem");
const PRIVATE_KEY_PATH = path.join(KEY_DIR, "private.pem");

// --- RSA keys ---
function loadPublicKey() {
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    throw new Error("RSA public key not found: keys/public.pem");
  }
  return fs.readFileSync(PUBLIC_KEY_PATH, "utf8");
}

function loadPrivateKey() {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error("RSA private key not found: keys/private.pem");
  }
  return fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
}

// 1) AES-256 key + IV(12 bytes)
function generateAes256Key() {
  return crypto.randomBytes(32); // 256-bit
}

function generateIv12() {
  return crypto.randomBytes(12); // recommended for GCM
}

// AES-GCM encrypt/decrypt
function aesGcmEncrypt(plainBuffer, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes by default
  return { ciphertext, tag };
}

function aesGcmDecrypt(cipherBuffer, key, iv, tag) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
  return plaintext;
}

// 2) RSA wrap/unwrap AES key (OAEP + SHA256)
function rsaWrapKey(aesKeyBuffer) {
  const publicKey = loadPublicKey();
  return crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKeyBuffer
  );
}

function rsaUnwrapKey(wrappedKeyBuffer) {
  const privateKey = loadPrivateKey();
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    wrappedKeyBuffer
  );
}

module.exports = {
  generateAes256Key,
  generateIv12,
  aesGcmEncrypt,
  aesGcmDecrypt,
  rsaWrapKey,
  rsaUnwrapKey,
};
