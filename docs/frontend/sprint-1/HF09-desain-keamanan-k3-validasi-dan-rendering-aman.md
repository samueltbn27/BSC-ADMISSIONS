# HF09 — Desain Keamanan K3: Validasi dan Rendering Aman

> **Sprint 1 — Perencanaan/desain saja.** Dokumen ini BUKAN implementasi kode dan BUKAN
> dokumentasi sistem yang sudah ada. Saat ini **tidak ada backend HTTP, endpoint, atau
> sesi yang existing** di repo ini; semua yang dirancang di bawah adalah **desain yang
> diusulkan untuk backend (Fadlan)** dan harus disepakati serta diimplementasikan oleh
> backend sebelum dapat diuji. Validasi sisi klien dalam dokumen ini adalah
> **kenyamanan pengguna dan pertahanan lapis pertama** — validasi yang menentukan
> tetap validasi server dan CHECK constraint database.

## 1. Tujuan

Merancang validasi input dan rendering aman frontend BSC Admissions (SMK Bina
Sarana Cendekia) yang selaras dengan kontrol K3 di `docs/database/SECURITY.md`,
kamus data di `docs/database/DATA_DICTIONARY.md`, dan kontrak integrasi di
`docs/database/INTEGRATION.md`, dengan prinsip: **validasi klien membantu
pengguna, validasi server yang memutuskan; rendering aman menampilkan data
pengguna sebagai teks, bukan sebagai kode.**

Ground truth yang mengikat desain ini:

- PostgreSQL 18; 5 jurusan TJKT/PPLG/ANIMASI/MPLB/OTOMOTIF; 3 dokumen wajib
  `graduation_proof` / `family_card` / `photo` + `supporting` opsional;
  maks 5 MiB per jenis dokumen (default `max_size_bytes` 5242880; rentang
  per jenis 1–20971520 byte), MIME yang diizinkan PDF/JPEG/PNG
  (`application/pdf`, `image/jpeg`, `image/png`).
- 8 status aplikasi: `draft`, `submitted`, `under_review`,
  `correction_requested`, `verified`, `selection_in_progress`, `completed`,
  `withdrawn`.
- Profil 7 field; submit memerlukan ketujuh field biodata dan 3 dokumen
  wajib. Field nullable memungkinkan draft; fungsi submit mewajibkan
  seluruh field.
- Catatan (`note`) pada verifikasi/histori/hasil dibatasi 1000 karakter
  (trim 1–1000; wajib saat `correction_requested`); jangan isi password,
  token, atau data yang tidak perlu.
- Backend wajib memakai ORM/query bind parameter, bukan interpolasi string;
  pesan 4xx/5xx generik tanpa nama tabel, stack trace, input, atau hash.

## 2. Batas format/panjang input per field (dari CHECK database)

Tabel ini adalah salinan batas dari `DATA_DICTIONARY.md` dan
`docs/database/SECURITY.md`. Frontend **harus** menerapkan batas yang sama di
sisi klien agar pengguna mendapat umpan balik segera — tetapi server dan
database tetap memvalidasi ulang; batas klien tidak menggantikan keduanya.

### 2.1 Akun (registrasi/login)

| Field | Batas (CHECK DB) | Validasi klien |
|---|---|---|
| Email | Pola email; maks 254 karakter; dinormalisasi lowercase/trim; UNIQUE | Pola email; maks 254 karakter; trim + lowercase sebelum kirim. |
| Password | Tidak ada CHECK panjang di DB; hash PHC Argon2id v19 (90–512 karakter; m = 19456–1048576 KiB, t = 2–20, p = 1–16) dibuat backend | Panjang minimum diputuskan backend (lihat HF07); frontend menegakkan panjang minimum itu setelah disepakati. Jangan pernah menampilkan/menyimpan password. |

### 2.2 Profil — 7 field biodata

| Field | Batas (CHECK DB) | Validasi klien |
|---|---|---|
| `full_name` (nama lengkap) | Panjang trim 1–150 | Wajib; 1–150 karakter setelah trim; tolak string kosong/hanya spasi. |
| `birthplace` (tempat lahir) | Panjang trim 1–100; nullable (draft boleh kosong) | Jika diisi: 1–100 karakter setelah trim. Wajib saat submit. |
| `birth_date` (tanggal lahir) | `date`, ≥ 1900-01-01 dan ≤ tanggal hari ini (trigger); nullable (draft boleh kosong) | Format tanggal valid; tidak sebelum 1900-01-01; tidak sesudah hari ini. Wajib saat submit. |
| `gender` (jenis kelamin) | `L` / `P`; nullable (draft boleh kosong) | Pilihan hanya `L` atau `P` (kontrol pilihan, bukan teks bebas). Wajib saat submit. |
| `address` (alamat) | Panjang trim 1–1000; nullable (draft boleh kosong) | Jika diisi: 1–1000 karakter setelah trim. Wajib saat submit. |
| `phone` (telepon) | E.164: `+` diikuti 8–15 digit, digit awal bukan nol; nullable (draft boleh kosong) | Pola `+` diikuti 8–15 digit, digit pertama bukan `0`; contoh format yang diterima: `+6281234567890`. Wajib saat submit. |
| Email (identitas akun, dipakai sebagai kontak) | Pola email; maks 254 karakter | Lihat §2.1. |

### 2.3 Aplikasi & dokumen

| Field | Batas (CHECK DB) | Validasi klien |
|---|---|---|
| Jurusan (`major_id`) | FK ke `majors`; kode TJKT/PPLG/ANIMASI/MPLB/OTOMOTIF; hanya yang `is_active` boleh dipilih untuk aplikasi baru | Pilihan dari katalog `bsc_api.get_catalog` (bukan daftar hardcoded, bukan teks bebas); TJKT adalah satu-satunya kode kanonis. |
| Periode (`period_id`) | FK ke `admission_periods`; `opens_at` < `closes_at`; hanya periode aktif | Pilihan dari katalog; frontend menampilkan periode aktif saja. |
| Dokumen wajib | `graduation_proof`, `family_card`, `photo` — wajib saat submit/verifikasi | Frontend menandai ketiganya wajib dan memblokir submit bila ada yang belum diunggah. |
| Dokumen opsional | `supporting` — opsional | Frontend menandai opsional dengan jelas. |
| Ukuran file | Per jenis 1–20971520 byte; default maks 5242880 byte (5 MiB) | Tolak file > 5 MiB (atau batas per jenis dari katalog, bila berbeda) sebelum upload; tampilkan ukuran file. Ukuran nyata tetap diperiksa server. |
| MIME file | `application/pdf`, `image/jpeg`, `image/png`; cocok allowlist per jenis | Terima hanya PDF/JPEG/PNG di pemilih file; periksa ekstensi/MIME yang diklaim di klien, tetapi **deteksi MIME dari konten, ukuran nyata, dan pemindaian malware tetap dilakukan server** — klaim klien bukan bukti. |
| `storage_key` | Format `applications/UUID/UUID`; prefix harus cocok `application_id`; bukan URL publik | Frontend **tidak pernah** menampilkan, menautkan, atau menerima `storage_key` dari pengguna. Key dibentuk server setelah upload tervalidasi. |

### 2.4 Catatan & hasil

| Field | Batas (CHECK DB) | Validasi klien |
|---|---|---|
| Catatan verifikasi (`verification_records.note`) | Trim 1–1000; **wajib** saat `correction_requested` | Wajib diisi saat memilih "minta perbaikan"; maks 1000 karakter; tampilkan penghitung karakter. |
| Catatan histori (`application_status_history.note`) | Trim 1–1000 | Jika diisi: 1–1000 karakter setelah trim. |
| Catatan hasil (`selection_results.note`) | Trim 1–1000 | Jika diisi: 1–1000 karakter setelah trim. |
| Hasil seleksi (`outcome`) | `accepted` / `waitlisted` / `rejected` | Pilihan dari kontrol pilihan (bukan teks bebas); hanya admin. |

### 2.5 Aturan umum validasi klien

- Validasi berjalan **saat pengguna mengetik/meninggalkan field** (umpan
  balik dini) dan **saat submit** (pemeriksaan akhir sebelum kirim).
- Draft boleh belum lengkap (field nullable di DB); submit memblokir bila 7
  field biodata atau 3 dokumen wajib belum lengkap — frontend menampilkan
  daftar kekurangan, bukan satu pesan samar.
- Pesan error server (400/422 generik) ditampilkan apa adanya; frontend
  tidak mencoba menebak detail constraint dari pesan generik.
- Jangan pernah mengirim SQL, nama tabel, atau detail constraint ke server
  sebagai bagian dari input; jangan menampilkan detail tersebut ke pengguna.

## 3. Pesan error UI per field

Pesan ditulis dalam Bahasa Indonesia, spesifik pada field, dan tidak
membocorkan detail internal. Contoh fiktif memakai nama "Calon Siswa Contoh"
dan email `calon.contoh@example.test`.

| Field | Kondisi | Pesan error UI |
|---|---|---|
| Email | Kosong | "Email wajib diisi." |
| Email | Format tidak valid | "Masukkan alamat email yang valid, contoh: calon.contoh@example.test." |
| Email | Lebih dari 254 karakter | "Email maksimal 254 karakter." |
| Password | Kosong | "Password wajib diisi." |
| Password | Di bawah panjang minimum (diputuskan backend) | "Password minimal [N] karakter." (N diisi setelah backend menetapkan.) |
| `full_name` | Kosong / hanya spasi | "Nama lengkap wajib diisi." |
| `full_name` | Lebih dari 150 karakter | "Nama lengkap maksimal 150 karakter." |
| `birthplace` | Lebih dari 100 karakter | "Tempat lahir maksimal 100 karakter." |
| `birth_date` | Kosong (saat submit) | "Tanggal lahir wajib diisi." |
| `birth_date` | Sebelum 1900-01-01 | "Tanggal lahir tidak boleh sebelum 1 Januari 1900." |
| `birth_date` | Sesudah hari ini | "Tanggal lahir tidak boleh sesudah hari ini." |
| `gender` | Belum dipilih (saat submit) | "Pilih jenis kelamin." |
| `address` | Kosong (saat submit) | "Alamat wajib diisi." |
| `address` | Lebih dari 1000 karakter | "Alamat maksimal 1000 karakter." |
| `phone` | Kosong (saat submit) | "Nomor telepon wajib diisi." |
| `phone` | Format bukan E.164 | "Masukkan nomor telepon dengan format internasional, contoh: +6281234567890 (diawali +, 8–15 digit, digit pertama bukan 0)." |
| Jurusan | Belum dipilih | "Pilih jurusan." |
| Periode | Belum dipilih / tidak aktif | "Pilih periode penerimaan yang masih aktif." |
| Dokumen wajib | Belum diunggah (saat submit) | "Dokumen [nama dokumen] wajib diunggah." |
| File | Lebih dari 5 MiB | "Ukuran file maksimal 5 MiB." |
| File | Bukan PDF/JPEG/PNG | "File harus berformat PDF, JPEG, atau PNG." |
| Catatan perbaikan | Kosong saat "minta perbaikan" | "Catatan perbaikan wajib diisi." |
| Catatan (umum) | Lebih dari 1000 karakter | "Catatan maksimal 1000 karakter." |
| Umum (server menolak) | Respons 400/422/500 generik | "Data tidak dapat disimpan. Periksa isian Anda dan coba lagi." (tanpa detail teknis; bila server memberi request ID yang aman, tampilkan untuk keperluan laporan.) |

## 4. Escaping & rendering aman

### 4.1 Aturan keras

- **Jangan pernah** memakai `innerHTML` atau `dangerouslySetInnerHTML`
  (atau padanan framework apa pun) untuk data pengguna — nama, alamat,
  catatan, nama file, atau teks apa pun yang berasal dari pengguna, panitia,
  atau admin.
- Semua data pengguna dirender sebagai **teks** melalui mekanisme escaping
  bawaan framework/template (misalnya interpolasi teks biasa / `textContent`),
  sehingga karakter `<`, `>`, `&`, `"`, `'` tampil sebagai karakter teks
  dan tidak pernah ditafsirkan sebagai markup atau skrip.
- Aturan ini berlaku juga untuk: nama jurusan/periode dari katalog, nomor
  pendaftaran, catatan verifikasi/histori/hasil, pesan error yang
  menggemakan input, dan isi atribut HTML (misalnya nilai `title`/`alt` yang
  berasal dari data pengguna harus di-escape oleh framework).
- Jangan membangun URL, query, atau HTML dengan menggabungkan (concat)
  string dari input pengguna tanpa escaping/encoding yang sesuai.
- Jangan menampilkan `storage_key` sebagai tautan; unduhan memakai link
  privat singkat/stream server setelah authorization (lihat INTEGRATION.md).

### 4.2 Kenapa

Satu tempat yang merender data pengguna sebagai HTML dapat menjadi celah XSS
persisten: penyerang menyimpan muatan skrip sebagai nama/alamat/catatan, dan
skrip itu berjalan di browser setiap pengguna yang melihat data tersebut —
termasuk panitia dan admin. Jika sesi disimpan dengan benar (cookie HttpOnly,
lihat HF07), skrip tetap dapat melakukan aksi atas nama korban melalui
permintaan terautentikasi dari browser korban. Escaping yang konsisten adalah
lapis pertahanan yang membuat muatan semacam itu tidak pernah menjadi kode.

### 4.3 Yang boleh dan tidak boleh

| Praktik | Status |
|---|---|
| Render data pengguna sebagai teks (interpolasi teks / `textContent`) | Wajib |
| `innerHTML` / `dangerouslySetInnerHTML` untuk data pengguna | Dilarang |
| `innerHTML` untuk markup statis yang sepenuhnya ditulis pengembang dan tidak mengandung data pengguna | Dihindari; bila tidak dapat dihindari, harus ditinjau dan dicatat dalam review — bukan keputusan sepihak implementor. |
| Menyisipkan data pengguna ke atribut HTML tanpa escaping framework | Dilarang |
| Menampilkan kembali input pengguna di pesan error tanpa escaping | Dilarang — pesan error memakai teks statis + nilai yang di-escape, atau lebih baik tidak menggemakan input sama sekali. |
| Mengirim data pengguna ke server tanpa validasi klien | Dihindari — validasi klien diterapkan (§2), tetapi server tetap memvalidasi ulang. |

## 5. Kasus uji XSS (contoh — untuk Rizki, QA/DevSecOps)

Kasus uji berikut adalah **contoh fiktif** untuk diuji setelah backend dan
frontend tersedia. Nama contoh: "Calon Siswa Contoh". Perilaku yang
diharapkan berlaku untuk **semua peran yang melihat data** (siswa pemilik,
panitia, admin).

### 5.1 Percobaan injeksi pada nama (`full_name`)

| # | Input percobaan (fiktif) | Perilaku yang diharapkan |
|---|---|---|
| X1 | `<script>alert('xss')</script>` sebagai nama | Tidak ada skrip yang berjalan. Nama ditampilkan sebagai teks harfiah `<script>alert('xss')</script>` di halaman profil/aplikasi/antrean, atau ditolak/disaring server dengan pesan validasi generik. Tidak ada alert, tidak ada permintaan tambahan. |
| X2 | `<img src=x onerror=alert('xss')>` sebagai nama | Tidak ada gambar/error handler yang berjalan. Ditampilkan sebagai teks harfiah, atau ditolak/disaring server. |
| X3 | `Calon Siswa Contoh<script>alert(1)</script>` | Bagian teks tampil sebagai teks; bagian skrip tidak berjalan. |
| X4 | `"><svg onload=alert('xss')>` sebagai nama | Ditampilkan sebagai teks harfiah; tidak ada elemen SVG yang dibuat dari input. |

### 5.2 Percobaan injeksi pada alamat (`address`)

| # | Input percobaan (fiktif) | Perilaku yang diharapkan |
|---|---|---|
| X5 | `<script>alert('xss')</script> Jl. Contoh No. 1` sebagai alamat | Tidak ada skrip yang berjalan. Alamat ditampilkan sebagai teks harfiah, atau ditolak/disaring server. |
| X6 | `Jl. Contoh <iframe src="https://example.test"></iframe>` | Tidak ada iframe yang dibuat dari input. Ditampilkan sebagai teks harfiah, atau ditolak/disaring server. |
| X7 | Alamat berisi `&lt;script&gt;` (entitas yang sudah di-escape) | Ditampilkan sekali-escape sebagai teks `&lt;script&gt;` — tidak terjadi double-unescape menjadi tag aktif. |

### 5.3 Percobaan injeksi pada catatan (`note` verifikasi/histori/hasil)

| # | Input percobaan (fiktif) | Perilaku yang diharapkan |
|---|---|---|
| X8 | `<script>alert('xss')</script>` sebagai catatan perbaikan (panitia) | Tidak ada skrip yang berjalan saat siswa, panitia lain, atau admin membaca catatan. Ditampilkan sebagai teks harfiah, atau ditolak/disaring server. |
| X9 | `<a href="javascript:alert('xss')">klik</a>` sebagai catatan hasil (admin) | Tidak ada tautan `javascript:` yang aktif. Ditampilkan sebagai teks harfiah, atau ditolak/disaring server. |
| X10 | Catatan berisi `'"--></script><script>alert('xss')</script>` | Tidak ada skrip yang berjalan; seluruh isi tampil sebagai teks, atau ditolak/disaring server. |

### 5.4 Catatan pengujian

- "Ditolak/disaring server" berarti: backend menolak input (400/422
  generik) atau menyimpan bentuk yang aman — keputusan antara menolak vs.
  menyimpan-then-escape adalah **keputusan backend** yang harus dicatat
  saat implementasi. Frontend tidak boleh mengandalkan salah satunya saja;
  rendering aman (§4) harus berlaku apa pun yang disimpan server.
- Pengujian memakai PREPARE/parameter berisi metakarakter di tingkat
  database sudah dilakukan di `tests/database/integrity.sql` dan memeriksa
  tabel tetap utuh — tetapi itu **tidak menguji endpoint HTTP yang belum
  tersedia**. Kasus X1–X10 menguji lapisan HTTP/frontend setelah backend
  tersedia.
- Pengujian tambahan yang diusulkan (INTEGRATION.md, untuk Rizki setelah
  backend tersedia): file palsu/berbahaya, error redaction, akun A mencoba
  ID aplikasi/dokumen B, dan race upload/submit.
- Data uji memakai domain `example.test` dan data fiktif; tidak ada data
  siswa asli dalam pengujian.

## 6. Hal yang secara eksplisit belum diputuskan / di luar cakupan desain ini

- Panjang minimum password dan kebijakan kekuatan password (diputuskan
  backend; lihat HF07).
- Keputusan backend: menolak input bermuatan markup vs. menyimpan lalu
  meng-escape saat render (§5.4).
- Kontrak HTTP/endpoint dan format respons error (diputuskan backend).
- Pemindaian malware, deteksi MIME dari konten, dan batas per jenis dokumen
  bila katalog menetapkan nilai berbeda dari default 5 MiB (backend;
  katalog adalah sumber kebenaran).
- Kebijakan retensi PII, akses siswa/orang tua, dan persetujuan (ditetapkan
  sekolah sebelum produksi).

## Status review

**Status: PENDING.** Dokumen ini adalah desain Sprint 1 yang diusulkan dan
**belum direview**. Persetujuan **belum diperoleh** dari reviewer yang
ditunjuk, **Rizki** (QA/DevSecOps). Tidak ada bagian dari desain ini yang
boleh dianggap disetujui atau siap diimplementasikan sebelum review Rizki
selesai dan persetujuan dicatat.
