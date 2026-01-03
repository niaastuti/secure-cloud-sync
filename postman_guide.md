# Panduan Testing dengan Postman - Secure Cloud Sync

Berikut adalah langkah-langkah untuk menguji API menggunakan Postman.

**Base URL**: `http://localhost:3000`

## 1. Setup Collection
Buat Collection baru di Postman bernama **"Secure Cloud Sync"**.

## 2. Skenario Testing (Berurutan)

### A. Upload File Baru (Simulasi Sync Upload)
Endpoint ini akan mengupload file, menghitung hash, mengenkripsi, dan menyimpannya sebagai Versi 1.

*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/sync/upload`
*   **Body**: `form-data`
    *   Key: `file` (File) -> Pilih file tes, misal `dokumen.txt`
*   **Expected Response**:
    ```json
    {
        "message": "File synced successfully",
        "file_id": "1709xxxx-dokumen.txt",
        "version": 1,
        "file_hash": "..."
    }
    ```
    > **Catat `file_id` dari response ini untuk langkah selanjutnya!**

### B. Update File (Versioning)
Endpoint ini untuk mengupload revisi file yang sama. Server akan otomatis menaikkan versi (Versi 2).

*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/update/:fileId`
    *   Ganti `:fileId` dengan ID yang didapat dari langkah A.
*   **Body**: `form-data`
    *   Key: `file` (File) -> Pilih file revisi, misal `dokumen_v2.txt`
*   **Expected Response**:
    ```json
    {
        "message": "File updated successfully",
        "new_version": 2,
        "previous_version_count": 1
    }
    ```

### C. Cek History Versi
Melihat daftar versi file yang tersimpan.

*   **Method**: `GET`
*   **URL**: `{{baseUrl}}/versions/:fileId`
*   **Expected Response**: JSON berisi `current_version` dan array `history`.

### D. Download File
Mendownload file yang terenkripsi dan otomatis didekripsi oleh server.

*   **Method**: `GET`
*   **URL**: `{{baseUrl}}/sync/download/:fileId`
    *   Opsional: Tambahkan query `?version=1` untuk download versi lama.
*   **Expected Response**: File terdownload dengan konten asli (plaintext).

### E. Manual Hybrid Encryption (Test RSA+AES)
Menguji fitur enkripsi manual tanpa upload file.

*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/hybrid/encrypt`
*   **Body**: `raw` (JSON)
    ```json
    {
      "text": "Rahasia Negara"
    }
    ```
*   **Expected Response**:
    ```json
    {
      "ciphertext_hex": "...",
      "rsa_wrapped_key_base64": "..."
    }
    ```

### F. Manual Hybrid Decryption
Menguji fitur dekripsi manual menggunakan output dari langkah E.

*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/hybrid/decrypt`
*   **Body**: `raw` (JSON)
    *   Copy-paste seluruh field dari response langkah E (`ciphertext_hex`, `iv_hex`, `auth_tag_hex`, `rsa_wrapped_key_base64`).
*   **Expected Response**:
    ```json
    {
      "decrypted_text": "Rahasia Negara"
    }
    ```

### G. Generate RSA Keys (Opsional)
Membuat pasangan kunci baru.

*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/keys/generate`
*   **Expected Response**: Menampilkan Public & Private Key baru.

---

## Tips
*   Gunakan fitur **Environment Variables** di Postman untuk menyimpan `baseUrl` dan `fileId` agar tidak perlu copy-paste berulang kali.
*   Pastikan server berjalan (`node app/server.js`) sebelum melakukan request.
