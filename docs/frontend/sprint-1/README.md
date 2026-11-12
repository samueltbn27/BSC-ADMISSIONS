# Paket Perencanaan Frontend — Sprint 1 BSC Admissions

Paket perencanaan frontend Sprint 1 untuk **Hafizd Ammar (Frontend Developer)**,
sistem Penerimaan Murid Baru SMK Bina Sarana Cendekia (BSC Admissions).

> **Ruang lingkup: perencanaan/desain saja.** Sprint 1 tidak membangun kode
> aplikasi, backend HTTP, maupun komponen UI. Semua kontrak HTTP dalam paket
> ini berstatus **DIUSULKAN** (proposed) — belum ada backend HTTP, OpenAPI,
> atau frontend di repository ini. Satu-satunya ground truth yang sudah ada
> adalah fondasi database PostgreSQL 18 beserta kontraknya di
> `docs/database/` (lihat § Ground truth).

## Status jujur

- **Tanggal Sprint 1: 2–8 November 2026 — sudah lewat.**
- **Paket ini diproduksi pada 12 November 2026**, setelah tanggal Sprint 1
  berakhir. Tidak ada klaim bahwa pekerjaan ini dilakukan pada 2–8 November 2026.
- **Semua review PENDING.** Tidak satu pun dokumen HF01–HF12 yang sudah
  direview atau disetujui Samuel, Fadlan, atau Rizki.
- **Stand-up: template 0/7. Tidak ada log harian 2–8 November 2026** — tidak
  ada log yang difabrikasi untuk menutup kekosongan tersebut (lihat HF12 §3).
- Board Trello tim ("03 | Hafizd Ammar Buana — Frontend Developer |
  BSC Admissions") dibaca read-only pada 12 November 2026: 19 kartu, 7 list;
  Sprint 1 HF01–HF12, semua checklist 0%; In Progress / Review / Done /
  Blocked kosong.

## Ground truth

Perencanaan ini berlandaskan kontrak database yang sudah ada di repository:

| Dokumen | Isi |
|---|---|
| `../database/INTEGRATION.md` | Kontrak integrasi: fungsi `bsc_api.*`, pemetaan error, aturan upload/download privat |
| `../database/DATA_DICTIONARY.md` | Skema `bsc`: tabel, kolom, constraint, 8 status, 3 peran, 5 jurusan, 3 dokumen wajib |
| `../database/SECURITY.md` | K1 (autentikasi), K2 (RBAC dan ownership), K3 (validasi dan SQL injection) |
| `../database/DESIGN.md` | Keputusan desain: model data, diagram state, transaksi, asumsi |
| `../database/ERD.md` | Diagram relasi entitas |

Fakta kunci yang dipakai di seluruh paket (jangan diubah oleh frontend):

- PostgreSQL 18, 12 tabel; peran `applicant` / `committee` / `admin`.
- 5 jurusan: TJKT (kanonis — TKJT ditolak), PPLG, ANIMASI, MPLB, OTOMOTIF.
- 3 dokumen wajib: `graduation_proof` (ijazah ATAU SKL, satu slot),
  `family_card`, `photo`; opsional `supporting`. Maks 5 MiB per jenis;
  PDF/JPEG/PNG (foto JPEG/PNG saja).
- 8 status aplikasi: `draft`, `submitted`, `under_review`,
  `correction_requested`, `verified`, `selection_in_progress`, `completed`,
  `withdrawn`.
- Profil 7 field: `full_name`, `birthplace`, `birth_date`, `gender` (L/P),
  `address`, `phone` (E.164). Tidak ada NIK/NISN.
- Nomor pendaftaran `BSC-<UUID>`.
- `selection_result` bernilai null berarti hasil belum tersedia bagi aktor —
  **jangan simpulkan gagal seleksi**. Hasil hanya terlihat setelah admin
  mempublikasikannya secara eksplisit, dan tidak dapat diubah setelah publish.
- Semua contoh orang dalam paket ini fiktif ("Calon Siswa Contoh",
  email `...@example.test`). Data dummy/sintetis saja — jangan pernah memakai
  data siswa nyata.

## Daftar dokumen

| Kartu | Dokumen | Isi | Reviewer | Status |
|---|---|---|---|---|
| HF01 | [HF01-ruang-lingkup-dan-rencana-sprint.md](HF01-ruang-lingkup-dan-rencana-sprint.md) | Ruang lingkup, verifikasi fitur PPDB, peta dependensi, rencana sprint | Fadlan | Draf selesai, review pending |
| HF02 | [HF02-daftar-halaman-sitemap-dan-routing.md](HF02-daftar-halaman-sitemap-dan-routing.md) | Daftar halaman, sitemap, dan routing (diagram Mermaid) | Samuel | Draf selesai, review pending |
| HF03 | [HF03-arsitektur-frontend-dan-komponen.md](HF03-arsitektur-frontend-dan-komponen.md) | Arsitektur frontend, rekomendasi framework, component tree, data flow | Fadlan | Draf selesai, review pending |
| HF04 | [HF04-spesifikasi-integrasi-api-dan-state.md](HF04-spesifikasi-integrasi-api-dan-state.md) | Spesifikasi integrasi API (kontrak HTTP diusulkan), state loading/error/kosong | Fadlan | Draf selesai, review pending |
| HF05 | [HF05-sistem-komponen-ui-dan-formulir.md](HF05-sistem-komponen-ui-dan-formulir.md) | Sistem komponen UI reusable dan spesifikasi formulir | Samuel | Draf selesai, review pending |
| HF06 | [HF06-desain-responsif-dan-aksesibilitas.md](HF06-desain-responsif-dan-aksesibilitas.md) | Desain responsif dan aksesibilitas | Samuel | Draf selesai, review pending |
| HF07 | [HF07-desain-keamanan-k1-autentikasi-dan-sesi.md](HF07-desain-keamanan-k1-autentikasi-dan-sesi.md) | Desain keamanan K1: autentikasi dan sesi | Fadlan | Draf selesai, review pending |
| HF08 | [HF08-desain-keamanan-k2-rute-terlindungi-dan-rbac.md](HF08-desain-keamanan-k2-rute-terlindungi-dan-rbac.md) | Desain keamanan K2: rute terlindungi dan RBAC | Fadlan | Draf selesai, review pending |
| HF09 | [HF09-desain-keamanan-k3-validasi-dan-rendering-aman.md](HF09-desain-keamanan-k3-validasi-dan-rendering-aman.md) | Desain keamanan K3: validasi dan rendering aman | Rizki | Draf selesai, review pending |
| HF10 | [HF10-desain-unggah-status-dan-pengumuman.md](HF10-desain-unggah-status-dan-pengumuman.md) | Desain unggah, timeline status, dan pengumuman | Samuel | Draf selesai, review pending |
| HF11 | [HF11-checklist-review.md](HF11-checklist-review.md) | Checklist review, tabel komentar reviewer (kosong), template daftar revisi | Samuel, Fadlan, Rizki | Draf selesai, review pending |
| HF12 | [HF12-serah-terima-dan-retrospektif.md](HF12-serah-terima-dan-retrospektif.md) | Serah terima dan retrospektif Sprint 1 | Samuel | Draf selesai, review pending |

Setiap dokumen diakhiri bagian **"Status review"** yang menyatakan review
PENDING dan persetujuan BELUM diperoleh. Jangan menulis bahwa Samuel,
Fadlan, atau Rizki sudah menyetujui apa pun sebelum review benar-benar
dilakukan dan dicatat pada HF11.

## Cara memakai paket ini

1. **Baca HF01 dulu** untuk ruang lingkup dan urutan kerja, lalu HF02–HF06
   untuk halaman, arsitektur, API, komponen, dan aksesibilitas.
2. **Baca HF07–HF09** sebelum merancang alur login, rute, atau formulir —
   keamanan (K1/K2/K3) adalah desain, bukan tempelan belakangan.
3. **Reviewer mengisi HF11**: ubah status tiap baris checklist menjadi
   `Disetujui` / `Perlu revisi` / `Tidak berlaku (dengan alasan)` hanya
   setelah pemeriksaan benar-benar dilakukan, isi tabel komentar reviewer,
   dan catat revisi pada template daftar revisi.
4. **Jangan mulai implementasi HB01–HB05 (backlog Sprint 2)** sebelum paket
   ini direview dan kontrak HTTP/backend tersedia.

## Yang tidak ada di paket ini

- Kode aplikasi, backend HTTP, URL endpoint, OpenAPI, komponen UI jadi.
- Bukti pengujian frontend (belum ada yang dapat diuji).
- Persetujuan reviewer, log harian 2–8 November 2026, atau bukti stand-up —
  semuanya dinyatakan jujur sebagai tidak ada / pending.
