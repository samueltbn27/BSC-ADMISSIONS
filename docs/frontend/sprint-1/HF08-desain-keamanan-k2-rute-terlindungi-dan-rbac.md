# HF08 — Desain Keamanan K2: Rute Terlindungi dan RBAC

> **Sprint 1 — Perencanaan/desain saja.** Dokumen ini BUKAN implementasi kode dan BUKAN
> dokumentasi sistem yang sudah ada. Saat ini **tidak ada backend HTTP, endpoint, atau
> sesi yang existing** di repo ini; semua yang dirancang di bawah adalah **desain yang
> diusulkan untuk backend (Fadlan)** dan harus disepakati serta diimplementasikan oleh
> backend sebelum dapat diuji. Frontend tidak boleh menganggap rute, peran, atau
> perlindungan di bawah sudah berjalan.

## 1. Tujuan

Merancang perlindungan rute dan kontrol akses berbasis peran (RBAC) frontend
BSC Admissions (SMK Bina Sarana Cendekia) yang selaras dengan kontrol K2 di
`docs/database/SECURITY.md` dan kontrak integrasi di
`docs/database/INTEGRATION.md`, dengan prinsip: **UI bukan satu-satunya
penegakan keamanan; server tetap mengotorisasi setiap permintaan.**

Ground truth yang mengikat desain ini:

- PostgreSQL 18; peran `applicant` / `committee` / `admin`; status akun
  `active` / `suspended` / `closed`. Akun `suspended`/`closed` ditolak oleh
  guard database.
- 5 jurusan: TJKT, PPLG, ANIMASI, MPLB, OTOMOTIF (kode kanonis; nama program
  ditampilkan dari katalog `bsc_api.get_catalog`, bukan ID hardcoded).
- 8 status aplikasi: `draft`, `submitted`, `under_review`,
  `correction_requested`, `verified`, `selection_in_progress`, `completed`,
  `withdrawn`.
- Fungsi yang relevan: `bsc_api.get_application`, `bsc_api.list_applications`,
  `bsc_api.create_application`, `bsc_api.change_major`,
  `bsc_api.put_document`, `bsc_api.change_application_status`,
  `bsc_api.verify_document`, `bsc_api.save_selection_result`,
  `bsc_api.publish_selection_result`, `bsc_api.manage_account`.
- `p_actor` (identitas aktor) harus diambil backend dari sesi yang telah
  diverifikasi — **bukan** dari body/query/header yang dipilih pengguna.
  Menyembunyikan UUID bukan otorisasi; backend tidak menerima actor/role
  dari request.

## 2. Matriks otorisasi K2 (dari SECURITY.md)

Matriks berikut adalah salinan matriks di `docs/database/SECURITY.md` dan
menjadi acuan tunggal desain ini. "Ya" berarti diizinkan untuk peran dan
kondisi tersebut; kondisi kepemilikan/state dijelaskan di §5.

| Operasi | Calon siswa aktif | Panitia aktif | Admin aktif |
|---|---|---|---|
| Baca katalog | Ya | Ya | Ya |
| Simpan profil/buat aplikasi | Milik sendiri | Tidak | Tidak |
| Baca aplikasi/list | Milik sendiri | Antrean seluruh periode | Seluruh periode |
| Ganti jurusan/unggah | Milik sendiri, draft/perbaikan | Tidak | Tidak |
| Submit/tarik | Milik sendiri dan state valid | Tidak | Tidak |
| Review/verifikasi | Tidak | State valid | State valid |
| Simpan/publish hasil | Tidak | Tidak | State valid/jadwal terpenuhi |
| Baca hasil sebelum publish | Tidak | Tidak | Ya |
| Baca hasil sesudah publish | Milik sendiri | Aplikasi yang dapat dilihat | Ya |
| Kelola role/status akun | Tidak | Tidak | Akun lain, batas profil |
| Mengubah tabel/audit langsung | Tidak | Tidak | Tidak melalui login runtime |

Catatan matriks:

- "Panitia aktif" membaca **antrean seluruh periode** (lintas periode),
  bukan hanya satu periode.
- "Admin aktif" membaca **seluruh periode**.
- Kelola akun oleh admin hanya untuk **akun lain** (bukan akun sendiri) dan
  "siswa berprofil tetap applicant" (`manage_account`).
- Tidak ada peran yang boleh mengubah tabel/audit langsung melalui login
  runtime; audit bersifat append-only.

## 3. Menu per peran (diusulkan)

Menu adalah **kenyamanan dan keterbacaan**, bukan pengaman. Menu hanya
menampilkan tautan yang relevan dengan peran pengguna yang sedang login;
penegakan sesungguhnya tetap di server (§7).

| Menu / halaman | Applicant | Committee | Admin |
|---|---|---|---|
| Beranda / katalog jurusan & periode | Ya | Ya | Ya |
| Profil saya (isi/ubah biodata) | Ya | Tidak | Tidak |
| Aplikasi saya (buat, lihat, ubah jurusan, unggah dokumen, submit, tarik) | Ya | Tidak | Tidak |
| Hasil seleksi saya (sesudah publish) | Ya | Tidak | Tidak |
| Antrean review (daftar aplikasi seluruh periode) | Tidak | Ya | Ya |
| Detail aplikasi + verifikasi dokumen | Tidak | Ya | Ya |
| Hasil seleksi (buat/lihat sebelum publish) | Tidak | Tidak | Ya |
| Publish hasil seleksi | Tidak | Tidak | Ya |
| Kelola akun & peran | Tidak | Tidak | Ya |
| Login / registrasi | (saat belum login) | (saat belum login) | (saat belum login) |

Aturan tampilan menu:

- Menu peran lain **disembunyikan**, bukan hanya dinonaktifkan, agar tidak
  memberi petunjuk struktur internal yang tidak relevan — tetapi
  penyembunyian ini tidak dianggap sebagai kontrol keamanan.
- Peran pengguna untuk keperluan tampilan menu berasal dari **sesi server**
  (misalnya profil sesi yang dikembalikan backend setelah login), bukan dari
  nilai yang ditulis frontend sendiri atau dari URL.
- Jika peran tidak diketahui (sesi tidak valid), frontend menampilkan menu
  publik saja (katalog, login, registrasi) dan mengarahkan ke login untuk
  halaman terautentikasi.

## 4. Tabel rute terlindungi per peran (diusulkan)

Rute di bawah adalah **nama rute konseptual** untuk keperluan desain; URL
pasti, nama path, dan kontrak HTTP belum ada dan diputuskan saat implementasi
bersama backend. "Perlindungan frontend" berarti: rute tidak dirender /
pengguna dialihkan (lihat §6). "Perlindungan server" berarti: endpoint
backend memeriksa sesi, peran, dan ownership sebelum memanggil fungsi
`bsc_api.*` — dan perlindungan server inilah yang menentukan.

| Rute (konseptual) | Applicant | Committee | Admin | Belum login |
|---|---|---|---|---|
| `/` (beranda/katalog) | Ya | Ya | Ya | Ya (publik) |
| `/registrasi` | Ya | Ya | Ya | Ya (publik) |
| `/login` | Ya | Ya | Ya | Ya (publik) |
| `/profil` | Ya (milik sendiri) | Tidak (403) | Tidak (403) | Alih ke `/login` (401) |
| `/aplikasi` (daftar aplikasi saya) | Ya (milik sendiri) | Tidak (403) | Tidak (403) | Alih ke `/login` (401) |
| `/aplikasi/baru` | Ya (milik sendiri) | Tidak (403) | Tidak (403) | Alih ke `/login` (401) |
| `/aplikasi/:id` | Ya (hanya milik sendiri; milik orang lain → 403/404 generik, lihat §6) | Ya (antrean) | Ya (seluruh periode) | Alih ke `/login` (401) |
| `/aplikasi/:id/dokumen` | Ya (milik sendiri, draft/perbaikan) | Tidak (403) | Tidak (403) | Alih ke `/login` (401) |
| `/hasil-saya` | Ya (sesudah publish; sebelum publish → tidak tersedia, lihat §5) | Tidak (403) | Tidak (403) | Alih ke `/login` (401) |
| `/antrean` | Tidak (403) | Ya | Ya | Alih ke `/login` (401) |
| `/review/:id` | Tidak (403) | Ya (state valid) | Ya (state valid) | Alih ke `/login` (401) |
| `/hasil` (kelola hasil seleksi) | Tidak (403) | Tidak (403) | Ya | Alih ke `/login` (401) |
| `/hasil/:id/publish` | Tidak (403) | Tidak (403) | Ya (state valid + jadwal terpenuhi) | Alih ke `/login` (401) |
| `/admin/akun` | Tidak (403) | Tidak (403) | Ya (akun lain) | Alih ke `/login` (401) |

Aturan umum rute:

- Setiap rute terautentikasi memeriksa sesi ke server (bukan hanya state
  lokal) sebelum menampilkan data.
- Rute yang dibuka dengan peran yang salah menampilkan halaman 403 (§6),
  bukan halaman kosong dan bukan data sebagian.
- Rute yang dibuka tanpa sesi menampilkan pengalihan ke login (§6).
- Mengubah URL secara manual tidak boleh membuka data — server menolak
  permintaan yang tidak berhak (lihat §7).

## 5. Aturan kepemilikan data

### 5.1 Calon siswa (applicant)

- Hanya dapat membaca, menyimpan, dan mengubah **aplikasi milik sendiri**
  (kepemilikan melalui `applicant_profiles.user_id` → aplikasi).
- Ganti jurusan dan unggah dokumen hanya saat status aplikasi
  `draft` atau `correction_requested` (perbaikan).
- Submit dan tarik (withdraw) hanya untuk aplikasi milik sendiri dan hanya
  saat state valid menurut state machine (submit memerlukan 7 field biodata
  dan 3 dokumen wajib — lihat HF09; `withdrawn` boleh dari sebelum/sudah
  submit).
- Membaca hasil seleksi **hanya milik sendiri dan hanya sesudah publish**.
  Sebelum publish, hasil tidak tersedia bagi siswa (respons `get_application`
  memberi `selection_result` null — null berarti "belum tersedia bagi aktor",
  bukan "gagal seleksi").

### 5.2 Panitia (committee)

- Membaca **antrean seluruh periode**: daftar aplikasi dari semua periode
  yang aktif untuk direview.
- Review/verifikasi dokumen dan aplikasi hanya saat state valid
  (`verify_document` hanya saat `under_review`; catatan wajib saat
  `correction_requested`).
- **Tidak** dapat menyimpan profil/membuat aplikasi, mengganti jurusan,
  mengunggah dokumen, submit/tarik, menyimpan/publish hasil, atau mengelola
  akun.
- Membaca hasil sesudah publish hanya untuk **aplikasi yang dapat dilihat**
  (yang ada dalam antrean/aksesnya); sebelum publish, hasil tidak tersedia
  bagi panitia.

### 5.3 Admin

- Membaca **seluruh periode** dan seluruh aplikasi.
- Review/verifikasi saat state valid; menyimpan dan mempublish hasil hanya
  saat state valid dan jadwal terpenuhi (`published_at >= announcement_at`;
  publish bersifat eksplisit melalui `publish_selection_result`).
- **Satu-satunya peran** yang dapat membaca hasil **sebelum publish**.
- Mengelola role/status akun **akun lain**; tidak mengelola akun sendiri
  melalui jalur ini, dan siswa berprofil tetap `applicant`.
- Tidak mengubah tabel/audit langsung melalui login runtime.

### 5.4 Aturan lintas peran

- Satu akun, satu peran (`role_code` di `users`). Tidak ada peran ganda.
- Akun `suspended`/`closed` tidak dapat mengakses rute terautentikasi apa
  pun, apa pun perannya.
- ID aplikasi/dokumen orang lain tidak boleh ditebak/diakses dengan mengubah
  URL: server memeriksa ownership/role sebelum mengembalikan data
  (`get_application` mengembalikan JSONB terbatas ownership/role).
  Frontend menampilkan 403/404 generik (lihat §6), bukan data orang lain.

## 6. State 401/403 — tampilan & pengalihan (diusulkan)

| Situasi | Kode server (diusulkan) | Tampilan frontend | Pengalihan |
|---|---|---|---|
| Belum login membuka rute terautentikasi | 401 | Halaman login | Alih ke `/login`, sertakan tujuan asal agar setelah login berhasil pengguna kembali ke rute yang diminta (tujuan asal disimpan sebagai data navigasi, bukan sebagai bukti hak akses). |
| Sesi kedaluwarsa saat memuat data | 401 | Pesan "Sesi Anda telah berakhir. Silakan login kembali." | Alih ke `/login`; state sesi lokal dihapus seperti pada logout (lihat HF07 §8). |
| Peran salah membuka rute peran lain | 403 | Halaman "Akses ditolak" (403): pesan generik "Anda tidak memiliki akses ke halaman ini." Tanpa menyebutkan data, peran yang dibutuhkan secara rinci, atau keberadaan objek. | Tetap di halaman 403 dengan tautan kembali ke beranda / halaman sesuai peran pengguna. Tidak dialihkan otomatis ke halaman yang dituju. |
| Akses objek milik orang lain (mis. applicant membuka aplikasi orang lain) | 403 atau 404 generik (diputuskan backend; INTEGRATION.md: `42501` → 403 atau 404 generik sesuai endpoint, jangan bocorkan keberadaan objek) | Halaman "Tidak ditemukan / akses ditolak" yang sama untuk kedua kasus, agar tidak membocorkan apakah objek ada. | Tautan kembali ke daftar milik pengguna. |
| Akun suspended/closed mencoba mengakses | 401/403 generik (diputuskan backend) | Pesan generik yang sama seperti login gagal (lihat HF07 §6); frontend tidak menjelaskan status akun. | Alih ke `/login`. |

Prinsip pesan error:

- Pesan 401/403 bersifat **generik** dan tidak membocorkan keberadaan objek,
  peran yang dibutuhkan, detail SQL, atau nama constraint/tabel.
- Frontend tidak menampilkan detail error mentah dari server (SQLSTATE,
  stack trace, hash) — backend mengembalikan pesan generik dan request ID
  yang aman bila diperlukan.

## 7. Penegasan: UI bukan satu-satunya penegakan keamanan

Pernyataan ini adalah inti desain K2 dan harus dipahami semua pihak:

1. **Menyembunyikan menu atau rute di frontend bukan kontrol keamanan.**
   Siapa pun dapat membuka alat pengembang browser, mengubah URL, atau
   memanggil endpoint backend secara langsung. Jika server tidak memeriksa,
   perlindungan frontend tidak berarti apa-apa.
2. **Backend tetap memeriksa authorization endpoint dan objek sebelum
   memanggil database** (SECURITY.md): sesi yang telah diverifikasi,
   peran dari sesi, kepemilikan objek, dan state aplikasi — pada setiap
   permintaan, bukan hanya saat login.
3. **Fungsi `bsc_api.*` adalah lapis pemeriksaan tambahan**, bukan pengganti
   otorisasi endpoint: fungsi memeriksa aktor/objek/status dengan identitas
   tepercaya yang diberikan server (`p_actor` dari sesi, bukan dari request).
4. **Menyembunyikan UUID bukan otorisasi.** UUID aplikasi/dokumen yang tidak
   ditampilkan di UI tetap dapat ditebak/diperoleh; server harus menolak
   akses yang tidak berhak apa pun UUID-nya.
5. **Role kontrol UI bukan pengaman utama** (INTEGRATION.md): jangan
   menampilkan hash, detail error SQL, storage key sebagai tautan publik,
   atau role kontrol UI sebagai pengaman utama.
6. Pengujian yang diusulkan untuk Rizki (QA/DevSecOps) setelah backend
   tersedia mencakup: akun A mencoba ID aplikasi/dokumen B, actor spoofing,
   role escalation, hasil belum diumumkan, dan akun suspended
   (INTEGRATION.md). Pengujian ini menguji **server**, bukan tampilan menu.

## 8. Hal yang secara eksplisit belum diputuskan / di luar cakupan desain ini

- URL path pasti, nama rute, dan kontrak HTTP/endpoint (diputuskan bersama
  backend saat implementasi).
- Nilai pasti dan kode status untuk setiap endpoint (backend; pemetaan error
  yang disarankan ada di INTEGRATION.md).
- Mekanisme sesi/cookie dan CSRF (lihat HF07; diputuskan backend).
- Kebijakan tenggat perbaikan, penarikan, waitlist, dan retensi PII
  (disahkan Samuel — BA/UI/UX — bila mengubah state machine/constraint,
  melalui migration berikutnya).

## Status review

**Status: PENDING.** Dokumen ini adalah desain Sprint 1 yang diusulkan dan
**belum direview**. Persetujuan **belum diperoleh** dari reviewer yang
ditunjuk, **Fadlan** (backend). Tidak ada bagian dari desain ini yang boleh
dianggap disetujui atau siap diimplementasikan sebelum review Fadlan selesai
dan persetujuan dicatat.
