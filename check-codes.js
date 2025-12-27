const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING ALL CODES FOR WEEK 3...\n');

// 1. Check cryptoService exports
console.log('1. Checking cryptoService.js exports...');
const cryptoPath = path.join(__dirname, 'services/cryptoService.js');
const cryptoContent = fs.readFileSync(cryptoPath, 'utf8');
const hasComputeSHA256 = cryptoContent.includes('computeSHA256,') || cryptoContent.includes('computeSHA256');
console.log(hasComputeSHA256 ? '   ✅ computeSHA256 exported' : '   ❌ computeSHA256 NOT exported');

// 2. Check sync.js imports
console.log('\n2. Checking sync.js...');
const syncPath = path.join(__dirname, 'routes/sync.js');
const syncContent = fs.readFileSync(syncPath, 'utf8');
const hasMulter = syncContent.includes('const multer = require');
const hasCryptoImport = syncContent.includes('require(\'../services/cryptoService\')');
const hasComputeCall = syncContent.includes('cryptoService.computeSHA256');

console.log(hasMulter ? '   ✅ multer imported' : '   ❌ multer missing');
console.log(hasCryptoImport ? '   ✅ cryptoService imported' : '   ❌ cryptoService import wrong');
console.log(hasComputeCall ? '   ✅ computeSHA256 called' : '   ❌ computeSHA256 not called');

// 3. Check upload.js updates
console.log('\n3. Checking upload.js...');
const uploadPath = path.join(__dirname, 'routes/upload.js');
const uploadContent = fs.readFileSync(uploadPath, 'utf8');
const hasComputeImport = uploadContent.includes('computeSHA256');
const hasHashField = uploadContent.includes('file_hash');

console.log(hasComputeImport ? '   ✅ computeSHA256 imported' : '   ❌ computeSHA256 not imported');
console.log(hasHashField ? '   ✅ file_hash in metadata' : '   ❌ file_hash missing');

// 4. Check server.js
console.log('\n4. Checking server.js...');
const serverPath = path.join(__dirname, 'app/server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');
const hasSyncRoute = serverContent.includes('require(\'../routes/sync\')');
const hasSyncUse = serverContent.includes('app.use(\'/sync\'');

console.log(hasSyncRoute ? '   ✅ sync route imported' : '   ❌ sync route not imported');
console.log(hasSyncUse ? '   ✅ /sync route registered' : '   ❌ /sync route not registered');

console.log('\n' + '='.repeat(50));
console.log('CHECK COMPLETE!');
console.log('If all ✅, your code is READY for Week 3 testing.');