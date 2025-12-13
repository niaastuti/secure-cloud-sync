const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating RSA Keypair...');

// Buat folder keys jika belum ada
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
  console.log('✅ Created keys directory');
}

// Generate RSA keypair
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

// Save keys
fs.writeFileSync(path.join(keysDir, 'public.pem'), keyPair.publicKey);
fs.writeFileSync(path.join(keysDir, 'private.pem'), keyPair.privateKey);

// Buat contoh untuk dokumentasi
fs.writeFileSync(
  path.join(keysDir, 'private.pem.example'),
  '-----BEGIN PRIVATE KEY-----\nPASTE_YOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----'
);

console.log('✅ RSA Keypair generated successfully!');
console.log('🔑 Public key: keys/public.pem');
console.log('🔒 Private key: keys/private.pem (KEEP THIS SECRET!)');
console.log('📋 Template: keys/private.pem.example');
console.log('\n⚠️  WARNING: Never share private.pem with anyone!');