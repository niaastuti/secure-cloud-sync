# Laporan Proyek Keamanan Komputer
**Topik 1: Implementasi dan Evaluasi Keamanan Sistem Sinkronisasi Berkas di Cloud Menggunakan Hybrid Cryptography (AES–RSA)**

---

## 1. Pendahuluan
### 1.1 Latar Belakang
Penyimpanan data di cloud membutuhkan mekanisme keamanan yang kuat untuk melindungi kerahasiaan (confidentiality) dan integritas (integrity) data. Proyek ini mengimplementasikan sistem sinkronisasi berkas aman menggunakan **Hybrid Cryptography**, menggabungkan kecepatan enkripsi simetris (AES-256) untuk data dan keamanan kunci asimetris (RSA-2048) untuk distribusi kunci.

### 1.2 Tujuan
1.  Membangun REST API untuk upload, download, dan update berkas secara aman.
2.  Menerapkan enkripsi AES-256-GCM untuk payload berkas.
3.  Menerapkan enkripsi RSA-2048 untuk pembungkusan kunci (Key Encapsulation).
4.  Menerapkan versioning dan integritas data menggunakan SHA-256.

---

## 2. Tinjauan Pustaka
### 2.1 Hybrid Cryptography
Sistem ini menggunakan dua algoritma:
*   **AES (Advanced Encryption Standard) 256-bit GCM mode**: Digunakan untuk mengenkripsi konten file karena efisiensi tingginya terhadap data besar. Mode GCM (Galois/Counter Mode) dipilih karena menyediakan fitur *authenticated encryption* (kerahasiaan + integritas).
*   **RSA (Rivest–Shamir–Adleman) 2048-bit**: Digunakan hanya untuk mengenkripsi kunci AES. Ini mengatasi masalah distribusi kunci simetris.

### 2.2 Mekanisme Sinkronisasi
Setiap berkas memiliki metadata yang menyimpan hash (SHA-256) dari konten asli. Saat sinkronisasi, server membandingkan hash file lokal client dengan hash di server untuk menentukan apakah upload diperlukan. Jika terjadi perubahan, versi file diinkremen.

---

## 3. Metodologi & Arsitektur Sistem
### 3.1 Arsitektur (Lihat `architecture.md` untuk Diagram)
Sistem dibangun menggunakan **Node.js** dan **Express**. Penyimpanan dilakukan secara lokal (Local Storage) yang mensimulasikan cloud storage, dibagi menjadi:
*   `storage/cipher`: Menyimpan file fisik yang terenkripsi (.bin).
*   `storage/metadata`: Menyimpan informasi file, key terenkripsi, IV, dan log versi (.json).

### 3.2 Skenario Pengujian
Pengujian dilakukan menggunakan **POSTMAN** dan **Automated Benchmark Script**.
1.  **Upload**: Mengirim file -> Server Hash -> AES Encrypt -> RSA Wrap -> Simpan.
2.  **Update**: Mengirim revisi -> Server Deteksi ID -> Arsip Versi Lama -> Encrypt Versi Baru -> Update Metadata.
3.  **Download**: Request ID -> Server Load Metadata -> RSA Unwrap -> AES Decrypt -> Kirim File.

---

## 4. Implementasi
Kode sumber utama:
*   `services/cryptoService.js`: Modul inti kriptografi.
*   `routes/sync.js`: Logika utama sinkronisasi.
*   `routes/update.js`: Logika versioning.

### Snippet Enkripsi (Hybrid)
```javascript
// 1. Enkripsi File dengan AES
const aesKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
// ... encrypt buffer ...

// 2. Bungkus Kunci AES dengan RSA
const wrappedKey = crypto.publicEncrypt(publicKey, aesKey);
```

---

## 5. Hasil & Analisis (D - Tabel Uji Performa)
Berikut adalah hasil pengujian performa enkripsi Hybrid pada perangkat uji.

| Payload Size | AES Encrypt (ms) | RSA Wrap (ms) | Total Encrypt (ms) | Decrypt (ms) | Overhead Bytes | Integrity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1 KB** | 2.197 | 4.846 | 7.043 | 4.571 | 0 | PASS |
| **100 KB** | 0.337 | 0.323 | 0.659 | 1.825 | 0 | PASS |
| **1 MB** | 2.021 | 0.355 | 2.376 | 2.787 | 0 | PASS |
| **5 MB** | 9.617 | 0.323 | 9.940 | 10.964 | 0 | PASS |

**Analisis:**
1.  **Efisiensi RSA**: Waktu *RSA Wrap* konstan (~0.3 - 0.4 ms) tidak peduli ukuran file, karena RSA hanya mengenkripsi kunci AES 32-byte, bukan file itu sendiri.
2.  **Skalabilitas AES**: Waktu enkripsi AES meningkat secara linear seiring ukuran file, namun tetap sangat cepat (< 10ms untuk 5MB).
3.  **Overhead**: Ciphertext memiliki ukuran yang hampir sama dengan plaintext (AES streaming), ditambah overhead metadata kecil (Wrapped Key 256 bytes + IV 12 bytes + Tag 16 bytes) yang disimpan di JSON terpisah.

---

## 6. Kesimpulan
Sistem Secure Cloud Sync berhasil diimplementasikan sesuai spesifikasi TOPIK 1. Penggunaan Hybrid Cryptography terbukti efektif menyeimbangkan performa dan keamanan. Mekanisme versioning berjalan baik dalam mendeteksi perubahan file dan menjaga riwayat revisi.

---
**Lampiran:**
*   Screenshot Postman (Lihat Folder `/screenshots` - *Perlu diambil manual*)
*   Source Code (Terlampir)
