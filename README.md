# BSC Admissions — Full-Stack PPDB

Sistem Penerimaan Murid Baru SMK Bina Sarana Cendekia. Repository ini berisi fondasi database PostgreSQL
**yang dipertahankan dari PR #1**, ditambah **frontend React** dan **backend REST API Express** yang
terhubung langsung ke database existing.

- Database: PostgreSQL 18 (skema `bsc` + API funkcional `bsc_api`/`bsc_auth`)
- Backend: Node.js + Express + TypeScript, session cookie aman, Argon2id (hash-wasm)
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Keamanan: secure session, RBAC, validasi input (Zod), parameterized DB ops, file upload aman, CSRF guard

## Struktur repository

```text
BSC-ADMISSIONS/
├── frontend/          # React + Vite + Tailwind
├── backend/           # Express + TypeScript REST API
├── database/          # Pertahankan existing (migration, seed, bootstrap)
├── docs/
│   ├── database/      # Pertahankan existing (ERD, dictionary, setup, security)
│   ├── frontend/      # Panduan frontend
│   ├── backend/       # Dokumentasi API
│   ├── security/      # Laporan implementasi keamanan
│   └── testing/       # Laporan pengujian
├── scripts/           # Pertahankan existing (runner migration/tes DB)
├── tests/             # Pertahankan existing (tes database SQL)
├── compose.yaml        # Opsional: PostgreSQL 18 via Docker
└── Makefile
```

## Prasyarat

- Node.js 20+ (diuji dengan 24)
- PostgreSQL 18 (lihat [database/setup](docs/database/SETUP.md))
- Python 3.9+ dan `psql` hanya untuk tooling database (opsional bila DB sudah ada)

## 1. Setup database (existing repository)

```sh
export PGHOST=127.0.0.1 PGPORT=5432 PGDATABASE=bsc_admissions PGUSER=bsc_migrator
make migrate
make seed
# lalu sebagai DBA:
psql -X -v ON_ERROR_STOP=1 -f database/bootstrap/privileges.sql
```

Buat login runtime terpisah (ilihat SETUP.md) dan isi kredensialnya di `backend/.env`.
Migration `003` menambah fungsi admin, pengumuman publik, dan helper yang dipakai backend.
**Jangan menghapus/mengubah tabel existing.**

## 2. Backend

```sh
cd backend
cp .env.example .env    # isi kredensial database
npm install
npm run dev             # http://localhost:4000
```

Test: `npm test` (unit + HTTP dengan mock DB; jalankan `RUN_DB_TESTS=1 npm test`
untuk mengaktifkan tes integrasi database nyata).

Build produksi: `npm run build && npm start`

## 3. Frontend

```sh
cd frontend
npm install
npm run dev             # http://localhost:5173 (proxy /api -> :4000)
```

Build produksi: `npm run build` (output `dist/`)

## Akun demo

Tidak ada akun default di seed. Buat akun melalui halaman **Daftar** (calon siswa),
lalu promosikan akun admin/panitia sesuai [setup admin](docs/database/SETUP.md#periode-dan-admin-awal)
atau melalui endpoint admin setelah ada admin aktif.

## Dokumentasi

- [ERD database](docs/database/ERD.md)
- [Data dictionary](docs/database/DATA_DICTIONARY.md)
- [Kontrak integrasi](docs/database/INTEGRATION.md)
- [Keamanan database](docs/database/SECURITY.md)
- [API backend](docs/backend/API.md)
- [Panduan frontend](docs/frontend/FRONTEND.md)
- [Implementasi keamanan aplikasi](docs/security/SECURITY-IMPLEMENTATION.md)
- [Laporan pengujian](docs/testing/TESTING-REPORT.md)
