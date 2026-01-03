# Secure Cloud Sync - Project Documentation

## 1. Project Overview
**Secure Cloud Sync** is a Node.js-based backend system designed for secure file synchronization and storage using Hybrid Cryptography. It was developed as part of a Computer Security course (Week 3 - Synchronization Features).

### Key Features
- **Hybrid Encryption**: Combines **AES-256-GCM** for file encryption and **RSA-2048** for key management.
- **Secure Synchronization**: Ensures file integrity and confidentiality during sync (upload/download).
- **Versioning**: Supports auto-versioning of files to keep track of changes.
- **Integrity Check**: Uses **SHA-256** hashes to verify file integrity and determine sync status.

---

## 2. Technical Architecture

### 2.1 File Structure
```
secure-cloud-sync/
├── app/
│   └── server.js          # Entry point (Express Server)
├── keys/                  # RSA Keypair storage (private.pem, public.pem)
├── routes/                # API Route Handlers
│   ├── sync.js            # Synchronization logic (Check, Upload, Download)
│   ├── upload.js          # Standard encrypted upload
│   └── download.js        # Standard decrypted download
├── services/
│   └── cryptoService.js   # Cryptography utilities (AES, RSA, SHA-256)
├── storage/               # Data Storage
│   ├── cipher/            # Encrypted binary files (.bin)
│   └── metadata/          # JSON metadata for files
└── check-codes.js         # Integrity check script
```

### 2.2 Security Mechanism (Hybrid Cryptography)
1.  **File Encryption (AES-GCM)**:
    -   Each file is encrypted with a unique, randomly generated **AES-256** key.
    -   A unique **12-byte IV** is generated for every encryption.
    -   Result: `ciphertext` + `auth_tag`.
2.  **Key Protection (RSA)**:
    -   The unique AES key is encrypted (wrapped) using the server's **RSA Public Key**.
    -   Result: `rsa_wrapped_key`.
3.  **Storage**:
    -   The encrypted file (`ciphertext`) is stored in `storage/cipher/`.
    -   The encryption keys (`rsa_wrapped_key`, `iv`, `tag`) are stored in `storage/metadata/`.
4.  **Decryption**:
    -   The server uses its **RSA Private Key** to unwrap the AES key.
    -   The unwrapped AES key validates the `auth_tag` and decrypts the file.

---

## 3. Core Components

### 3.1 Services (`services/cryptoService.js`)
-   `generateAes256Key()`: Generates 32-byte random key.
-   `aesGcmEncrypt(buffer, key, iv)`: Encrypts data, returns ciphertext & auth tag.
-   `rsaWrapKey(aesKey)`: Encrypts AES key with RSA Public Key (OAEP-SHA256).
-   `readerUnwrapKey(wrappedKey)`: Decrypts AES key with RSA Private Key.
-   `computeSHA256(buffer)`: Generates SHA-256 hash for integrity checks.

### 3.2 API Endpoints

#### A. Synchronization (`/sync`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/sync/check` | Checks if a file needs upload/download based on Hash & Version. |
| `POST` | `/sync/upload` | Uploads a file, generates Hash, Encrypts, and Auto-increments version. |
| `GET` | `/sync/download/:file_id` | Downloads a specific file. Supports `?version=X`. |

#### B. Standard Operations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/upload` | Basic encrypted upload (Week 2 logic). |
| `GET` | `/download/:id` | Basic decrypted download (Week 2 logic). |

---

## 4. Metadata Structure
Request metadata is stored as JSON in `storage/metadata/`:
```json
{
  "file_id": "1704250000000-example.txt",
  "filename": "1704250000000-example.txt.bin",
  "original_name": "example.txt",
  "version": 2,
  "timestamp": "2024-01-03T10:00:00.000Z",
  "rsa_wrapped_key": "BASE64_STRING...",
  "aes_iv": "BASE64_STRING...",
  "aes_tag": "BASE64_STRING...",
  "file_hash": "SHA256_HASH_STRING...",
  "last_synced_version": 2
}
```

## 5. Setup & Usage
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Generate Keys**:
    Run this once to create `keys/public.pem` and `keys/private.pem`.
    ```bash
    node generateKeys.js
    ```
3.  **Start Server**:
    ```bash
    node app/server.js
    ```
4.  **Verify Setup**:
    Run the check script to ensure all modules are correctly exported/imported.
    ```bash
    node check-codes.js
    ```
