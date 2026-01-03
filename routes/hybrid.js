const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const {
    generateAes256Key,
    generateIv12,
    aesGcmEncrypt,
    aesGcmDecrypt,
    rsaWrapKey,
    rsaUnwrapKey
} = require('../services/cryptoService');

// POST /hybrid/encrypt
// Menerima raw text, melakukan enkripsi Hybrid lengkap
router.post('/encrypt', (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text required' });

        const buffer = Buffer.from(text, 'utf8');

        // 1. AES Encrypt
        const aesKey = generateAes256Key();
        const iv = generateIv12();
        const { ciphertext, tag } = aesGcmEncrypt(buffer, aesKey, iv);

        // 2. RSA Wrap Key
        const wrappedKey = rsaWrapKey(aesKey);

        res.json({
            original_text: text,
            ciphertext_hex: ciphertext.toString('hex'),
            iv_hex: iv.toString('hex'),
            auth_tag_hex: tag.toString('hex'),
            rsa_wrapped_key_base64: wrappedKey.toString('base64'),
            message: 'Hybrid Encryption Successful'
        });

    } catch (error) {
        res.status(500).json({ error: 'Encryption failed', detail: error.message });
    }
});

// POST /hybrid/decrypt
// Menerima parameter enkripsi, mengembalikan text asli
router.post('/decrypt', (req, res) => {
    try {
        const { ciphertext_hex, iv_hex, auth_tag_hex, rsa_wrapped_key_base64 } = req.body;

        if (!ciphertext_hex || !iv_hex || !auth_tag_hex || !rsa_wrapped_key_base64) {
            return res.status(400).json({ error: 'All crypto parameters required (ciphertext, iv, tag, wrappedKey)' });
        }

        // 1. RSA Unwrap Key
        const wrappedKey = Buffer.from(rsa_wrapped_key_base64, 'base64');
        const aesKey = rsaUnwrapKey(wrappedKey);

        // 2. AES Decrypt
        const cipherBuffer = Buffer.from(ciphertext_hex, 'hex');
        const iv = Buffer.from(iv_hex, 'hex');
        const tag = Buffer.from(auth_tag_hex, 'hex');

        const plaintextBuffer = aesGcmDecrypt(cipherBuffer, aesKey, iv, tag);
        const plaintext = plaintextBuffer.toString('utf8');

        res.json({
            decrypted_text: plaintext,
            message: 'Hybrid Decryption Successful'
        });

    } catch (error) {
        console.error('Decrypt Hybrid Error:', error);
        res.status(500).json({ error: 'Decryption failed', detail: error.message });
    }
});

module.exports = router;
