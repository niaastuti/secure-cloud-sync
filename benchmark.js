const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const {
    generateAes256Key,
    generateIv12,
    aesGcmEncrypt,
    aesGcmDecrypt,
    rsaWrapKey,
    rsaUnwrapKey,
    computeSHA256
} = require('./services/cryptoService');

console.log('🚀 STARTING BENCHMARK - Secure Cloud Sync');
console.log('==============================================');

// Prepare Dummy Data (Small, Medium, Large)
const SIZES = {
    '1KB': 1024,
    '100KB': 100 * 1024,
    '1MB': 1024 * 1024,
    '5MB': 5 * 1024 * 1024
};

const results = [];

for (const [label, size] of Object.entries(SIZES)) {
    console.log(`\nTesting Payload: ${label} (${size} bytes)`);

    const buffer = require('crypto').randomBytes(size);

    // 1. Measure AES Encryption
    const t1 = performance.now();
    const aesKey = generateAes256Key();
    const iv = generateIv12();
    const { ciphertext, tag } = aesGcmEncrypt(buffer, aesKey, iv);
    const t2 = performance.now();
    const aesTime = t2 - t1;

    // 2. Measure RSA Wrap (Key Encapsulation)
    const t3 = performance.now();
    const wrappedKey = rsaWrapKey(aesKey);
    const t4 = performance.now();
    const rsaTime = t4 - t3;

    // 3. Measure Decryption (Unwrap + AES Decrypt)
    const t5 = performance.now();
    const unwrappedKey = rsaUnwrapKey(wrappedKey);
    const decrypted = aesGcmDecrypt(ciphertext, unwrappedKey, iv, tag);
    const t6 = performance.now();
    const decryptTime = t6 - t5;

    // Verify
    const isMatch = buffer.equals(decrypted);

    results.push({
        Payload: label,
        'Size (Bytes)': size,
        'AES Encrypt (ms)': aesTime.toFixed(3),
        'RSA Wrap (ms)': rsaTime.toFixed(3),
        'Total Encrypt (ms)': (aesTime + rsaTime).toFixed(3),
        'Decrypt (ms)': decryptTime.toFixed(3),
        'Cipher Overhead (Bytes)': ciphertext.length - size,
        'Integrity Check': isMatch ? 'PASS' : 'FAIL'
    });
}

console.log('\n\n📊 BENCHMARK RESULTS TABLE');
console.log('==============================================');
console.table(results);

// Output to CSV-like format for copy-paste
console.log('\nCSV Format:');
console.log('Payload,Size,AES_Enc_ms,RSA_Wrap_ms,Total_Enc_ms,Decrypt_ms,Overhead_Bytes');
results.forEach(r => {
    console.log(`${r.Payload},${r['Size (Bytes)']},${r['AES Encrypt (ms)']},${r['RSA Wrap (ms)']},${r['Total Encrypt (ms)']},${r['Decrypt (ms)']},${r['Cipher Overhead (Bytes)']}`);
});
console.log('==============================================');
