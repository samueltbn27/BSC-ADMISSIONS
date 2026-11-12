# HF11 — Checklist Review

## Tujuan

Dokumen ini adalah checklist review atas seluruh paket perencanaan frontend Sprint 1 BSC Admissions (SMK Bina Sarana Cendekia). Tujuannya adalah memastikan setiap dokumen perencanaan — sitemap, komponen, API, autentikasi, RBAC, dan validasi — diperiksa oleh reviewer sebelum paket diserahterimakan dan sebelum implementasi Sprint 2 dimulai.

Dokumen ini berisi: (1) tabel checklist dengan kolom item/kriteria/status, (2) tabel komentar reviewer yang masih kosong, dan (3) template daftar revisi. Semua status review pada dokumen ini adalah **"Belum direview"** karena review belum dilakukan. Tidak ada komentar reviewer yang diisi — tabel komentar sengaja dibiarkan kosong dan tidak boleh diisi dengan komentar yang difabrikasi.

Dasar pemeriksaan adalah kontrak database pada `docs/database/INTEGRATION.md`, `DATA_DICTIONARY.md`, `SECURITY.md`, dan `DESIGN.md`. Sprint 1 adalah perencanaan/desain saja; tidak ada backend HTTP atau frontend existing yang dapat diuji saat dokumen ini ditulis (12 November 2026).

## 1. Checklist review

Status pada seluruh baris adalah **Belum direview**. Kolom "Status" hanya boleh berubah setelah reviewer yang bersangkutan benar-benar melakukan review dan mencatat hasilnya pada §2.

### 1.1 Sitemap dan routing (HF01–HF02)

| # | Item | Kriteria | Status |
|---|---|---|---|
| 1.1.1 | Sitemap mencakup seluruh halaman peran applicant | Semua halaman calon siswa tercakup: beranda, registrasi/login, profil, buat aplikasi, unggah dokumen, detail aplikasi/linimasa, pengumuman | Belum direview |
| 1.1.2 | Sitemap mencakup seluruh halaman peran committee | Halaman antrean review seluruh periode, detail aplikasi, verifikasi dokumen | Belum direview |
| 1.1.3 | Sitemap mencakup seluruh halaman peran admin | Halaman kelola akun, simpan/publish hasil seleksi, kelola periode (bila dirancang) | Belum direview |
| 1.1.4 | Routing memisahkan area publik dan area terautentikasi | Halaman yang membutuhkan sesi tidak dapat diakses tanpa login | Belum direview |
| 1.1.5 | Routing memakai nomor pendaftaran sebagai pengenal tampilan | `registration_number` format `BSC-<UUID>` dipakai sebagai pengenal, bukan sebagai faktor autentikasi | Belum direview |
| 1.1.6 | Tidak ada rute yang mengasumsikan backend HTTP existing | Dokumen tidak mengklaim adanya endpoint HTTP, URL endpoint, atau OpenAPI — belum ada kontrak HTTP | Belum direview |

### 1.2 Sistem komponen (HF05)

| # | Item | Kriteria | Status |
|---|---|---|---|
| 1.2.1 | Komponen formulir profil | Mencakup tujuh field biodata: full_name, birthplace, birth_date, gender, address, phone (plus email sebagai identitas login) | Belum direview |
| 1.2.2 | Komponen pemilih jurusan | Menampilkan nama program dari katalog (`get_catalog`); kode kanonis TJKT, alias TKJT ditolak | Belum direview |
| 1.2.3 | Komponen unggah dokumen | Mencakup tipe/ukuran/progress/error/ganti file sesuai HF10 | Belum direview |
| 1.2.4 | Komponen linimasa status | Menampilkan delapan status dan riwayat dari `get_application.history` | Belum direview |
| 1.2.5 | Komponen pengumuman | Menampilkan "Hasil belum tersedia" saat `selection_result` null; tidak menyimpulkan gagal seleksi | Belum direview |
| 1.2.6 | Konsistensi label dan bahasa | Label berbahasa Indonesia konsisten di seluruh komponen; tidak ada label yang bertentangan dengan ground truth | Belum direview |

### 1.3 Spesifikasi API dan integrasi (HF03–HF04)

| # | Item | Kriteria | Status |
|---|---|---|---|
| 1.3.1 | Pemetaan fungsi `bsc_api.*` | Seluruh fungsi yang dipakai frontend terpetakan: `register_account`, `save_profile`, `get_catalog`, `create_application`, `change_major`, `put_document`, `change_application_status`, `verify_document`, `save_selection_result`, `publish_selection_result`, `get_application`, `list_applications` | Belum direview |
| 1.3.2 | Pemakaian `get_catalog` | Jurusan, periode, dan jenis dokumen dibaca dari katalog, bukan ID hardcoded | Belum direview |
| 1.3.3 | Pemakaian `get_application` | Frontend memakai `application`, `profile`, `documents`, `history`, `verifications`, `selection_result` sesuai kontrak; hasil null diperlakukan sebagai belum tersedia | Belum direview |
| 1.3.4 | Batasan `list_applications` | Limit 1–100, default 50; offset untuk paginasi; kolom yang ditampilkan sesuai kontrak | Belum direview |
| 1.3.5 | Tidak ada klaim kontrak HTTP | Dokumen tidak mengklaim adanya URL endpoint, OpenAPI, atau komponen UI existing | Belum direview |
| 1.3.6 | Penanganan error | Pemetaan error generik (403/404 generik untuk 42501, 409 untuk 23505, 400/422 untuk error validasi, 500 dengan request ID aman); tidak ada SQLSTATE/detail constraint/hash yang dikirim ke klien | Belum direview |

### 1.4 Autentikasi (K1)

| # | Item | Kriteria | Status |
|---|---|---|---|
| 1.4.1 | Alur registrasi dan login | Registrasi memakai `register_account` (email + password_hash, tanpa role dari klien); login memakai lookup auth dan verifikasi Argon2id di backend | Belum direview |
| 1.4.2 | Sesi berasal dari server | Aktor berasal dari sesi server, bukan dari body/query/header yang dipilih pengguna | Belum direview |
| 1.4.3 | Tidak ada hash di frontend | `password_hash` tidak pernah dikirim ke atau ditampilkan di frontend | Belum direview |
| 1.4.4 | Error login generik | Pesan login tidak membedakan apakah akun ada atau tidak (mencegah enumerasi) | Belum direview |
| 1.4.5 | Ganti password | `replace_password_hash` hanya setelah reautentikasi; perubahan hash membatalkan sesi lama | Belum direview |
| 1.4.6 | Akun suspended/closed | Akun berstatus suspended/closed ditolak pada operasi terautentikasi | Belum direview |

### 1.5 RBAC dan ownership (K2)

| # | Item | Kriteria | Status |
|---|---|---|---|
| 1.5.1 | Matriks peran | Matriks peran applicant/committee/admin pada `SECURITY.md` tercermin dalam desain UI (baca katalog, simpan profil, baca aplikasi, unggah, submit/tarik, review/verifikasi, simpan/publish hasil, kelola akun) | Belum direview |
| 1.5.2 | Ownership calon siswa | Calon siswa hanya membaca/mengubah aplikasi dan dokumen milik sendiri; siswa lain ditolak | Belum direview |
| 1.5.3 | Panitia lintas periode | Panitia melihat antrean seluruh periode; belum ada pembatasan per penugasan/jurusan (sesuai asumsi desain) | Belum direview |
| 1.5.4 | Visibilitas hasil seleksi | Sebelum publish hanya admin yang melihat hasil; sesudah publish siswa melihat milik sendiri, panitia melihat aplikasi yang dapat dilihatnya | Belum direview |
| 1.5.5 | Kontrol UI bukan pengaman utama | Role kontrol UI tidak dijadikan satu-satunya pengaman; otorisasi ditegakkan server sebelum memanggil fungsi database | Belum direview |
| 1.5.6 | Tidak ada akses langsung ke database dari browser | PostgreSQL tidak dibuka langsung kepada browser/pengguna; backend tidak menerima actor/role dari request | Belum direview |

### 1.6 Validasi (K3) dan keamanan data

| # | Item | Kriteria | Status |
|---|---|---|---|
| 1.6.1 | Validasi profil | Tujuh field biodata wajib saat submit; format email dan telepon E.164 (+ diikuti 8–15 digit, digit awal bukan nol); tanggal lahir ≥ 1900-01-01 dan ≤ hari ini | Belum direview |
| 1.6.2 | Validasi dokumen | Tiga dokumen wajib saat submit; batas 5 MiB per jenis; PDF/JPEG/PNG, foto JPEG/PNG saja; `graduation_proof` adalah ijazah ATAU SKL dalam satu slot | Belum direview |
| 1.6.3 | Validasi state machine | Transisi status hanya sesuai diagram state delapan status; `completed` dan `withdrawn` terminal | Belum direview |
| 1.6.4 | File privat | Tidak ada tautan publik dari `storage_key`; unduhan hanya lewat server setelah otorisasi; nama file asli tidak disimpan di database | Belum direview |
| 1.6.5 | Tidak ada PII berlebih | Catatan verifikasi/histori/hasil dibatasi 1000 karakter dan tidak diisi data yang tidak perlu; tidak ada NIK/NISN | Belum direview |
| 1.6.6 | Zona waktu tampilan | Semua waktu disimpan sebagai `timestamptz` dan ditampilkan dalam zona Asia/Jakarta | Belum direview |

### 1.7 Konsistensi ground truth

| # | Item | Kriteria | Status |
|---|---|---|---|
| 1.7.1 | Lima jurusan | TJKT (kanonis), PPLG, ANIMASI, MPLB, OTOMOTIF; tidak ada jurusan lain | Belum direview |
| 1.7.2 | Delapan status | draft, submitted, under_review, correction_requested, verified, selection_in_progress, completed, withdrawn | Belum direview |
| 1.7.3 | Tiga peran | applicant, committee, admin | Belum direview |
| 1.7.4 | HB01–HB05 sebagai backlog | HB01–HB05 disebut sebagai backlog Sprint 2+ saja; implementasinya tidak dirancang pada Sprint 1 | Belum direview |
| 1.7.5 | Contoh fiktif | Semua contoh memakai nama "Calon Siswa Contoh" dan email `...@example.test`; tidak ada data siswa nyata | Belum direview |
| 1.7.6 | Tidak ada klaim persetujuan | Dokumen tidak mengklaim Samuel, Fadlan, atau Rizki menyetujui apa pun sebelum review benar-benar dilakukan | Belum direview |

## 2. Tabel komentar reviewer

Tabel ini **kosong**. Komentar hanya boleh diisi oleh reviewer yang bersangkutan setelah benar-benar melakukan review. Jangan mengisi tabel ini dengan komentar yang difabrikasi, diasumsikan, atau disimpulkan dari pesan lain.

| Reviewer | Komentar | Tindak lanjut |
|---|---|---|
| | | |
| | | |
| | | |
| | | |
| | | |

## 3. Template daftar revisi

Setiap revisi yang timbul dari review dicatat dengan format berikut. Daftar ini masih kosong; entri ditambahkan setelah review dilakukan dan komentar pada §2 ditindaklanjuti.

| No. | Dokumen terkait | Komentar reviewer | Perubahan yang dilakukan | Status |
|---|---|---|---|---|
| R-01 | | | | Belum dikerjakan |
| R-02 | | | | Belum dikerjakan |
| R-03 | | | | Belum dikerjakan |

Ketentuan pengisian:

- **No.** — nomor urut revisi (R-01, R-02, dst.).
- **Dokumen terkait** — nama file dokumen yang direvisi (mis. `HF10-desain-unggah-status-dan-pengumuman.md`).
- **Komentar reviewer** — kutipan atau ringkasan komentar dari §2 yang menjadi dasar revisi, beserta nama reviewernya.
- **Perubahan yang dilakukan** — uraian perubahan pada dokumen.
- **Status** — `Belum dikerjakan` / `Sedang dikerjakan` / `Selesai` / `Ditolak dengan alasan` (penolakan harus disertai alasan tertulis dan persetujuan reviewer).

## 4. Cara melakukan review

1. Reviewer membaca dokumen HF01–HF12 dan dokumen database (`docs/database/INTEGRATION.md`, `DATA_DICTIONARY.md`, `SECURITY.md`, `DESIGN.md`).
2. Reviewer memeriksa setiap baris checklist pada §1 dan mengubah statusnya menjadi `Disetujui`, `Perlu revisi`, atau `Tidak berlaku (dengan alasan)` — hanya setelah pemeriksaan benar-benar dilakukan.
3. Reviewer menulis komentar pada §2 dengan namanya sendiri.
4. Setiap komentar yang memerlukan perubahan dicatat sebagai entri revisi pada §3.
5. Paket dinyatakan siap serah terima bila seluruh baris checklist berstatus `Disetujui` atau `Tidak berlaku (dengan alasan)`, seluruh komentar pada §2 sudah ditindaklanjuti, dan seluruh entri revisi pada §3 berstatus `Selesai` atau `Ditolak dengan alasan`.

Sampai langkah-langkah di atas dilakukan, paket Sprint 1 berstatus **belum direview** dan belum disetujui.

## Status review

Review **PENDING**. Persetujuan **BELUM diperoleh**. Reviewer dokumen ini: **Samuel, Fadlan, Rizki** — ketiganya masih pending. Dokumen ini ditulis pada 12 November 2026 sebagai bagian dari paket perencanaan Sprint 1; tanggal Sprint 1 (2–8 November 2026) sudah lewat saat dokumen ini diproduksi, dan tidak ada klaim bahwa pekerjaan ini dilakukan pada 2–8 November 2026.
