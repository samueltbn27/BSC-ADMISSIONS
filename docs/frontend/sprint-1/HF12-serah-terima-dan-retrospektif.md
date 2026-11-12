# HF12 — Serah Terima dan Retrospektif

## Tujuan

Dokumen ini adalah paket serah terima perencanaan frontend Sprint 1 BSC Admissions (SMK Bina Sarana Cendekia) beserta retrospektif Sprint 1. Dokumen ini merangkum apa saja yang diserahkan, status jujur setiap dokumen per 12 November 2026, catatan stand-up, backlog Sprint 2, dan pelajaran dari sprint ini.

Sprint 1 adalah perencanaan/desain saja. Tidak ada backend HTTP atau frontend existing yang dibangun pada sprint ini.

## 1. Paket serah terima

### 1.1 Dokumen perencanaan frontend (Sprint 1)

Dokumen-dokumen berikut membentuk paket perencanaan frontend Sprint 1:

| Dokumen | Isi |
|---|---|
| `docs/frontend/sprint-1/HF01-ruang-lingkup-dan-rencana-sprint.md` | Ruang lingkup, dependensi, dan rencana sprint |
| `docs/frontend/sprint-1/HF02-daftar-halaman-sitemap-dan-routing.md` | Daftar halaman, sitemap, dan routing (perencanaan) |
| `docs/frontend/sprint-1/HF03-arsitektur-frontend-dan-komponen.md` | Arsitektur frontend dan struktur komponen (perencanaan) |
| `docs/frontend/sprint-1/HF04-spesifikasi-integrasi-api-dan-state.md` | Spesifikasi integrasi API (kontrak HTTP diusulkan) dan state loading/error/kosong |
| `docs/frontend/sprint-1/HF05-sistem-komponen-ui-dan-formulir.md` | Sistem komponen UI dan formulir (perencanaan) |
| `docs/frontend/sprint-1/HF06-desain-responsif-dan-aksesibilitas.md` | Desain responsif dan aksesibilitas (perencanaan) |
| `docs/frontend/sprint-1/HF07-desain-keamanan-k1-autentikasi-dan-sesi.md` | Desain keamanan K1 (autentikasi dan sesi) |
| `docs/frontend/sprint-1/HF08-desain-keamanan-k2-rute-terlindungi-dan-rbac.md` | Desain keamanan K2 (rute terlindungi dan RBAC) |
| `docs/frontend/sprint-1/HF09-desain-keamanan-k3-validasi-dan-rendering-aman.md` | Desain keamanan K3 (validasi dan rendering aman) |
| `docs/frontend/sprint-1/HF10-desain-unggah-status-dan-pengumuman.md` | Desain unggah, linimasa status delapan status, dan aturan visibilitas pengumuman |
| `docs/frontend/sprint-1/HF11-checklist-review.md` | Checklist review, tabel komentar reviewer (kosong), dan template daftar revisi |
| `docs/frontend/sprint-1/HF12-serah-terima-dan-retrospektif.md` | Dokumen ini: serah terima dan retrospektif |

### 1.2 Dokumen database (kontrak ground truth)

Seluruh perencanaan frontend di atas berlandaskan kontrak database berikut, yang merupakan ground truth dan tidak boleh diubah oleh frontend:

| Dokumen | Isi |
|---|---|
| `docs/database/INTEGRATION.md` | Kontrak integrasi tim: fungsi `bsc_api.*`, pemetaan error, aturan upload/download privat |
| `docs/database/DATA_DICTIONARY.md` | Skema `bsc`: tabel, kolom, constraint, delapan status, tiga peran, lima jurusan, tiga dokumen wajib |
| `docs/database/SECURITY.md` | Secure by design: K1 (autentikasi), K2 (RBAC dan ownership), K3 (validasi dan SQL injection), data pribadi dan dokumen |
| `docs/database/DESIGN.md` | Keputusan desain: model data, diagram state delapan status, transaksi, asumsi yang perlu disepakati |
| `docs/database/ERD.md` | Diagram relasi entitas |
| `docs/database/SETUP.md` | Prosedur setup database |
| `docs/database/TEST_RESULTS.md` | Hasil tes database |

### 1.3 Yang TIDAK diserahkan

- Tidak ada kode aplikasi (frontend maupun backend). Sprint 1 adalah perencanaan/desain saja.
- Tidak ada backend HTTP, URL endpoint, atau OpenAPI — belum ada kontrak HTTP.
- Tidak ada komponen UI yang sudah dibangun.
- Tidak ada bukti pengujian frontend — tidak ada yang dapat diuji karena belum ada yang dibangun.
- Tidak ada persetujuan reviewer — seluruh review masih pending (lihat §2).

## 2. Status jujur per 12 November 2026

Pernyataan berikut adalah status yang sebenarnya, tanpa pembulatan ke atas:

- **Tanggal Sprint 1 adalah 2–8 November 2026. Tanggal tersebut sudah lewat.**
- **Pekerjaan perencanaan ini diproduksi pada 12 November 2026** — setelah tanggal Sprint 1 berakhir. **Dokumen ini tidak mengklaim bahwa pekerjaan dilakukan pada 2–8 November 2026.**
- **SEMUA review PENDING.** Tidak satu pun dokumen HF01–HF12 yang sudah direview atau disetujui pada saat dokumen ini ditulis.
- **Tidak ada klaim persetujuan** dari Samuel, Fadlan, atau Rizki. Siapa pun yang membaca paket ini harus memeriksa sendiri status review pada bagian "Status review" di akhir setiap dokumen dan pada HF11.
- Checklist review HF11: seluruh item berstatus **"Belum direview"**; tabel komentar reviewer **kosong**; template daftar revisi **kosong**.
- Ground truth database (PostgreSQL 18, 5 jurusan, 3 dokumen wajib, 8 status, 3 peran, fungsi `bsc_api.*`) sudah ada dan menjadi satu-satunya fondasi yang terverifikasi dari paket ini. Segala hal di luar kontrak database tersebut adalah rancangan yang masih menunggu review.

## 3. Catatan stand-up

- Template stand-up: **0/7** (nol dari tujuh hari). Tidak ada entri stand-up yang terisi untuk Sprint 1.
- **TIDAK ADA log harian 2–8 November 2026.** Dokumen ini tidak memuat log harian apa pun untuk tanggal-tanggal tersebut, dan tidak ada log harian yang difabrikasi untuk menutup kekosongan tersebut.
- Template stand-up harian (untuk dipakai pada sprint berikutnya, bukan sebagai catatan yang sudah terjadi):

| Hari | Kemarin | Hari ini | Kendala |
|---|---|---|---|
| | | | |

- Stand-up berikutnya (Sprint 2) wajib diisi setiap hari kerja dan menjadi bukti kehadiran proses, bukan dokumen yang dibuat belakangan.

## 4. Backlog Sprint 2

Backlog Sprint 2 adalah **HB01–HB05**. Sesuai aturan Sprint 1, kelima item ini disebut sebagai backlog saja — **implementasinya tidak dirancang pada dokumen ini** dan bukan bagian dari Sprint 1:

| Item | Keterangan |
|---|---|
| HB01 | Backlog Sprint 2+ (implementasi) |
| HB02 | Backlog Sprint 2+ (implementasi) |
| HB03 | Backlog Sprint 2+ (implementasi) |
| HB04 | Backlog Sprint 2+ (implementasi) |
| HB05 | Backlog Sprint 2+ (implementasi) |

Rincian isi masing-masing HB mengikuti board Trello tim dan bukan bagian dari dokumen ini. Implementasi HB01–HB05 dimulai setelah paket Sprint 1 direview dan disetujui, dan setelah kontrak HTTP/backend tersedia.

## 5. Retrospektif Sprint 1

### 5.1 Apa yang berjalan

- Kontrak database sudah lengkap dan terverifikasi (PostgreSQL 18): skema, fungsi `bsc_api.*`, matriks RBAC, state machine delapan status, dan dokumen `INTEGRATION.md` / `DATA_DICTIONARY.md` / `SECURITY.md` / `DESIGN.md` tersedia sebagai ground truth yang kokoh untuk perencanaan frontend.
- Cakupan Sprint 1 jelas sejak awal: perencanaan/desain saja (HF01–HF12), tanpa implementasi — sehingga tidak ada pekerjaan implementasi yang setengah jadi dan tidak ada klaim palsu tentang kode yang sudah ada.
- Paket perencanaan frontend (HF01–HF12) berhasil diproduksi pada 12 November 2026 dengan merujuk langsung pada kontrak database, termasuk aturan unggah, diagram state, visibilitas pengumuman, dan checklist review yang jujur tentang status pending-nya.

### 5.2 Kendala

- **Keterlambatan jadwal.** Tanggal Sprint 1 (2–8 November 2026) sudah lewat ketika pekerjaan perencanaan ini diproduksi (12 November 2026). Pekerjaan tidak selesai di dalam jendela sprint.
- **Akses Trello.** Board Trello tim ("03 | Hafizd Ammar Buana — Frontend Developer | BSC Admissions") dibaca read-only pada 12 November 2026 (19 kartu, 7 list; Sprint 1 HF01–HF12, semua checklist 0%, stand-up 0/7; In Progress/Review/Done/Blocked kosong). Pembacaan itu memerlukan login Google SSO pemilik board, sehingga verifikasi kartu dilakukan melalui pembacaan tersebut dan dokumen perencanaan ini berlandaskan kartu-kartu itu beserta kontrak database di repo lokal.
- **Tidak ada review yang terlaksana.** Seluruh review (Samuel, Fadlan, Rizki) masih pending; paket diserahkan tanpa satu pun persetujuan. Risiko: rancangan dapat mengandung kesalahan asumsi yang baru ketahuan saat review.
- **Tidak ada stand-up dan log harian.** Template stand-up 0/7 dan tidak ada log harian 2–8 November 2026, sehingga tidak ada jejak proses harian yang dapat diaudit untuk sprint ini.

### 5.3 Pelajaran

- Jadwal sprint harus dijaga dengan pengingat harian; keterlambatan satu sprint membuat seluruh artefak "terlambat" dan memaksa penulisan status jujur seperti pada §2 — yang benar, tetapi seharusnya tidak perlu terjadi.
- Akses ke alat kolaborasi (Trello) harus dipastikan sebelum sprint dimulai, bukan di tengah jalan; ketergantungan pada login satu orang menjadi titik hambatan.
- Kejujuran status (review pending, tidak ada log) harus dipertahankan apa pun keadaannya: mengisi tabel komentar reviewer atau log harian secara retrospektif akan menghasilkan bukti palsu dan merusak kepercayaan tim.
- Ground truth yang tertulis (kontrak database) terbukti menjadi penopang utama ketika akses ke sumber lain (board Trello) terhambat — dokumentasi kontrak yang lengkap memungkinkan pekerjaan tetap berjalan.

### 5.4 Tindak lanjut

| # | Tindak lanjut | Penanggung jawab | Status |
|---|---|---|---|
| 1 | Samuel mereview paket HF01–HF12 dan mengisi komentar pada HF11 | Samuel | Belum dikerjakan |
| 2 | Fadlan mereview aspek API/integrasi dan keamanan pada HF11 | Fadlan | Belum dikerjakan |
| 3 | Rizki mereview aspek validasi dan QA pada HF11 | Rizki | Belum dikerjakan |
| 4 | Tindaklanjuti seluruh komentar review melalui daftar revisi HF11 §3 | Tim | Belum dikerjakan |
| 5 | Pastikan akses Trello tim sebelum Sprint 2 dimulai | Tim | Belum dikerjakan |
| 6 | Isi stand-up setiap hari kerja selama Sprint 2 | Tim | Belum dikerjakan |
| 7 | Sahkan nama lima jurusan/TJKT, tiga dokumen wajib, batas upload, dan asumsi-asumsi pada `DESIGN.md` yang masih menunggu pengesahan Samuel | Samuel | Belum dikerjakan |
| 8 | Mulai HB01–HB05 hanya setelah review Sprint 1 selesai dan kontrak HTTP/backend tersedia | Tim | Belum dikerjakan |

## Status review

Review **PENDING**. Persetujuan **BELUM diperoleh**. Reviewer dokumen ini: **Samuel**. Dokumen ini ditulis pada 12 November 2026 sebagai bagian dari paket perencanaan Sprint 1; tanggal Sprint 1 (2–8 November 2026) sudah lewat saat dokumen ini diproduksi, dan tidak ada klaim bahwa pekerjaan ini dilakukan pada 2–8 November 2026. Komentar dan tindak lanjut review dicatat pada HF11.
