# System Architecture & Flowcharts - Secure Cloud Sync

## 1. System Architecture
The system follows a REST API architecture using Node.js (Express) with local storage for files and metadata.

```mermaid
graph TD
    User[User / Client] -- HTTP/JSON --> API[REST API Server (Node.js)]
    
    subgraph "Backend System"
        API -- "Auth & Validation" --> Controller[Route Controllers]
        
        Controller -- "Encrypt/Decrypt" --> Crypto[Crypto Service]
        Crypto -- "AES-256-GCM" --> AES[AES Engine]
        Crypto -- "RSA-2048" --> RSA[RSA Engine]
        
        Controller -- "Read/Write" --> Storage[Storage System]
        
        Storage -- "JSON" --> MetaDB[(Metadata Store)]
        Storage -- "Bin (Encrypted)" --> FileStore[(Cipher Storage)]
        Storage -- "PEM" --> KeyStore[(Key Storage)]
    end
```

## 2. Upload Process Flow (Encryption)
```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant CS as CryptoService
    participant DB as Storage
    
    C->>S: POST /sync/upload (File)
    S->>CS: computeSHA256(File)
    CS-->>S: File Hash
    
    S->>CS: generateAesKey() + generateIV()
    S->>CS: aesGcmEncrypt(File, Key, IV)
    CS-->>S: Ciphertext + Auth Tag
    
    S->>CS: rsaWrapKey(Key)
    CS-->>S: Wrapped Key
    
    S->>DB: Save Ciphertext (.bin)
    S->>DB: Save Metadata (.json)
    
    S-->>C: 200 OK (File ID, Version 1)
```

## 3. Update Process Flow (Versioning)
```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    
    C->>S: POST /update/:fileId (New File)
    S->>S: Read Old Metadata
    S->>S: Archive Old File (Rename to _v1.bin)
    
    S->>S: Encrypt New File (New Key/IV)
    S->>S: Overwrite Main Cipher File
    
    S->>S: Update Metadata (Version++, Add to History)
    S-->>C: 200 OK (Version 2)
```

## 4. Download Process Flow (Decryption)
```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant CS as CryptoService
    
    C->>S: GET /sync/download/:fileId
    S->>S: Read Metadata
    S->>S: Read Ciphertext & Key Param
    
    S->>CS: rsaUnwrapKey(WrappedKey)
    CS-->>S: AES Key
    
    S->>CS: aesGcmDecrypt(Ciphertext, AES Key, IV, Tag)
    CS-->>S: Plaintext File
    
    S-->>C: Return File Download
```
