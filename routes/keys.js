const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// POST /keys/generate
// Menghasilkan pasangan kunci RSA baru (tanpa menyimpan ke server, hanya return response)
// Berguna untuk client yang membutuhkan key sendiri atau sekadar testing generation.
router.post('/generate', (req, res) => {
    try {
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        res.json({
            message: 'New RSA Keypair Generated',
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            note: 'Copy and save these keys. They are NOT stored on the server by this endpoint request.'
        });

    } catch (error) {
        res.status(500).json({ error: 'Key generation failed', detail: error.message });
    }
});

module.exports = router;
