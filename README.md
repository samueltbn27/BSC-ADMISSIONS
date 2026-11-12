# BSC Admissions — Demo V1 UTS Manpro

Prototype akademik Sistem Penerimaan Murid Baru SMK Bina Sarana Cendekia. **Gunakan data sintetis saja.** Demo V1 menghubungkan registrasi/login, draft biodata, jurusan PostgreSQL, unggah berkas privat, pengiriman, verifikasi panitia, catatan koreksi, histori, dan dashboard admin.

Integrasi ini dilakukan **12 November 2026**, bukan klaim fitur selesai pada Sprint 1 (2–8 November). PR database [#1](https://github.com/samueltbn27/BSC-ADMISSIONS/pull/1) terverifikasi merged ke main pada 6 November 2026 (merge `233df9b`, kontribusi `9b1e2bd`). Branch `PM-backend-fadlan` dan `frontend-dev-hafizd` diintegrasikan secara lokal ke `feature/demo-v1-uts`; tidak ada push atau merge Demo V1 ke main.

## Mulai di checkout Demo V1

Node.js 24 direkomendasikan (minimal 22.12), npm, Python 3.9+, PostgreSQL 18 lengkap dengan `psql`, `initdb`, `pg_ctl`, dan `postgres`. Pada macOS: `brew install postgresql@18`. Port 4000 dan 55441 harus tersedia.

```sh
# Dari direktori checkout BSC-ADMISSIONS yang memuat implementasi Demo V1:
npm --prefix backend ci
npm --prefix frontend ci
python3 scripts/demo.py setup
npm --prefix backend run build
npm --prefix frontend run build
python3 scripts/demo.py start
```

Buka **http://localhost:4000**. Express menyajikan build frontend dan API dalam satu origin. Seluruh aset runtime lokal tanpa CDN/font eksternal. Setup membuat backend/.env sendiri; jangan menimpa dengan contoh konfigurasi setelah setup.

Untuk clone baru: `git clone https://github.com/samueltbn27/BSC-ADMISSIONS.git`, lalu `cd BSC-ADMISSIONS`. **Demo V1 belum dipush**, sehingga clone main saja belum memuat implementasi ini. Gunakan checkout lokal/arsip branch Demo V1 yang diberikan tim; setelah tim mempublikasikannya, checkout branch `feature/demo-v1-uts` sebelum perintah setup di atas.

## Stack dan struktur

- Backend existing: Express 4 + TypeScript + PostgreSQL `pg`, Zod, Argon2id (hash-wasm).
- Frontend existing: React 18 + TypeScript + Vite + Tailwind + React Query + React Router.
- Database: PostgreSQL 18; 12 tabel inti Husni tetap dipertahankan. Migration 003 dari branch backend menambah tabel pengumuman dan helper API. Migration 001/002 tidak diubah.

```text
BSC-ADMISSIONS/
├── backend/
│   ├── scripts/seed-demo.ts   # Bootstrap development dengan password acak
│   ├── src/                  # API, auth/session, RBAC, validasi, upload privat
│   └── tests/                # Unit dan HTTP; integrasi DB opt-in
├── frontend/src/             # Halaman publik, siswa, panitia, admin
├── database/
│   ├── migrations/           # 001–003 SQL up/down; checksum runner
│   ├── seeds/reference.sql   # 3 role, 5 jurusan, 4 jenis dokumen
│   └── bootstrap/privileges.sql
├── scripts/demo.py           # setup/reset/start/stop/test-db lokal terisolasi
├── scripts/database.py       # Migration asli Husni
├── scripts/test_database.py  # Runner SQL scratch database
├── tests/                    # Tooling dan assertion SQL
├── docs/DEMO_V1_GUIDE.md      # Panduan klik dan rekaman
├── docs/demo/                # Audit, keputusan, laporan hasil sebenarnya
└── .local/demo/              # Diabaikan Git: cluster, akun, fixtures, upload
```

## Data dan akun demo

Baca `.local/demo/accounts.json` secara lokal (izin 0600). Password unik acak untuk setiap akun dan dibuat ulang saat reset; tidak ada password default dalam source/migration. Email utama:

- Siswa: `siswa.demo@example.test` (profil awal tersedia, belum ada aplikasi).
- Panitia: `panitia.demo@example.test`.
- Admin: `admin.demo@example.test`.
- Tiga akun `contoh-1` sampai `contoh-3` menampilkan data sintetis dengan berkas nyata di storage privat.

Akun siswa baru juga dapat dibuat melalui `/register`, lalu `/login`. Akun panitia/admin tidak dapat dibuat lewat registrasi publik. Role aktor DB berasal dari sesi backend yang diverifikasi ulang, bukan body/query client.

Fixtures ada di `.local/demo/fixtures/dokumen-dummy.pdf` dan `foto-dummy.png`. Dokumen wajib aktual: ijazah/SKL, kartu keluarga, pas foto. Batas default 5 MiB; pas foto JPG/PNG, jenis lain PDF/JPG/PNG. Ekstensi/MIME/signature dan konten parse diperiksa, berkas disimpan 0600 di luar frontend, download memeriksa sesi dan ownership/role. Tidak ada malware scanner.

## Reset dan berhenti

Hentikan backend (Ctrl+C), kemudian:

```sh
python3 scripts/demo.py reset
python3 scripts/demo.py start
# Sesudah menghentikan backend, hentikan PostgreSQL bila tidak diperlukan:
python3 scripts/demo.py stop
```

Reset hanya database demo yang dimiliki script dan ditandai marker; menolak cluster/folder lain dan menolak ketika port web aktif. Reset menghapus akun rekaman lama, mengganti password, dan membuat ulang data sintetis. Periode aktif mulai kemarin sampai 30 hari setelah reset. Tidak ada jadwal resmi sekolah yang dikarang.

## Environment dan database existing tim

Setup demo mengisi `backend/.env` (diabaikan Git). Untuk setup manual, salin `backend/.env.example` dan isi kredensial lewat pengelolaan lokal. Root `.env.example` hanya referensi runner SQL; runner tidak memuat .env otomatis.

| Variabel | Fungsi |
|---|---|
| NODE_ENV, HOST, PORT | Mode; default bind loopback dan port 4000 |
| PGHOST, PGPORT, PGDATABASE | Koneksi PostgreSQL backend |
| PGUSER_RUNTIME, PGPASSWORD_RUNTIME | Login hanya anggota bsc_runtime |
| PGUSER_AUTH, PGPASSWORD_AUTH | Login hanya anggota bsc_authenticator |
| SESSION_COOKIE_NAME, SESSION_TTL_HOURS | Cookie HttpOnly/SameSite=Lax, 8 jam |
| COOKIE_SECURE | false untuk HTTP lokal; true untuk deployment HTTPS |
| UPLOAD_DIR, UPLOAD_MAX_BYTES | Direktori privat, batas global 5 MiB untuk demo |
| ALLOWED_ORIGIN | http://localhost:4000; harus sama dengan origin browser |
| RATE_LIMIT_MAX, RATE_LIMIT_AUTH_MAX | 300 request/menit dan 10 autentikasi/menit/IP |
| FRONTEND_DIST | ../frontend/dist, relatif dari working directory backend |
| PG_BINDIR | Opsional: lokasi binary PostgreSQL 18 untuk script demo |

Untuk database tim, ikuti [SETUP](docs/database/SETUP.md). Jangan arahkan script demo ke database tim. **Prasyarat migration 003 dari branch backend:** DBA harus membuat capability NOLOGIN `bsc_runtime` dan `bsc_authenticator` sebelum menjalankan migration dari kosong, karena 003 memiliki GRANT eksplisit. Kemudian sebagai migrator:

```sh
export PGHOST=127.0.0.1 PGPORT=5432 PGDATABASE=bsc_admissions PGUSER=bsc_migrator
python3 scripts/database.py migrate
python3 scripts/database.py seed
# Jalankan bootstrap sebagai DBA pada database aplikasi:
psql -X -v ON_ERROR_STOP=1 -f database/bootstrap/privileges.sql
```

Akun backend tidak boleh menggunakan DBA/migrator. Runtime hanya EXECUTE API, auth hanya lookup akun. Setup demo otomatis menyiapkan pemisahan tersebut. PostgreSQL terikat ke 127.0.0.1; autentikasi TCP SCRAM dengan password acak. Socket administratif trust berada dalam folder privat 0700 pada cluster lokal disposable, bukan konfigurasi produksi.

Untuk pengembangan dua server: `cd backend && npm run dev`, lalu `cd frontend && npm run dev` pada terminal kedua. Kosongkan FRONTEND_DIST dan set ALLOWED_ORIGIN=http://localhost:5173 di backend/.env, lalu restart backend. Jalur demo satu origin lebih sederhana untuk rekaman.

## Keamanan dan pengujian

K1: Argon2id m=65536 KiB/t=3/p=1, sesi acak server setelah login, logout/invalidation, rate limit. K2: middleware role + ownership pada fungsi SQL; role/status/password_changed_at diperiksa setiap request terlindungi. K3: Zod server, query bind parameters, rendering React escaped, error tanpa detail SQL/stack, pembatasan request dan upload. Header Helmet dan pemeriksaan origin membatasi permintaan lintas situs.

**Instruksi terakhir pengguna: jangan menjalankan pengujian tambahan.** Build diperlukan untuk menjalankan aplikasi; kelulusan alur/browser final tidak diklaim. Lihat [hasil sebenarnya](docs/demo/IMPLEMENTATION_REPORT.md). Jika tim kemudian mengizinkan pengujian:

```sh
npm --prefix backend test
# HTTP integrasi DB opt-in, menambah akun sintetis pada database backend/.env:
cd backend
RUN_DB_TESTS=1 npm test
# Kembali ke root; suite database membuat scratch DB, bukan menghapus data aplikasi:
cd ..
python3 scripts/demo.py test-db
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

## Batas Demo V1

Prototype lokal satu proses, sesi di memori; restart mengakhiri sesi. Belum ada UAT/browser end-to-end final, antivirus/CDR, kuota disk/retensi otomatis, restore backup, pengujian beban, pentest atau deployment/TLS produksi. Penyimpanan lokal tidak transaksional dengan filesystem; kegagalan proses saat upload dapat meninggalkan orphan file, dibersihkan reset. Ringkasan admin/panitia existing menggunakan maksimal 100 profil pertama, memadai untuk fixture demo tetapi perlu agregasi DB sebelum skala produksi. Tidak ada OTP/email, pembayaran, OCR, AI, Dapodik, seleksi otomatis atau hosting produksi.

[Urutan rekaman, troubleshooting dan cuplikan 60–120 detik](docs/DEMO_V1_GUIDE.md) · [Audit integrasi](docs/demo/IMPLEMENTATION_REPORT.md) · [ERD](docs/database/ERD.md) · [Dictionary](docs/database/DATA_DICTIONARY.md) · [Kontrak API](docs/backend/API.md).

Tim: Fadlan Rabbani (PM/Backend), Samuel Tambunan (BA/UI/UX), Hafizd Ammar Buana (Frontend), Rizki Fauzi (QA/DevSecOps), Muhamad Husni Al Muhjiri (Database/System Analyst), Taqqy Fazha Ghafarra (Documentation/UAT).
