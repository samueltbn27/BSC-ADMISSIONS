# BSC Admissions

Sistem Penerimaan Murid Baru SMK Bina Sarana Cendekia. Kontribusi ini menyediakan fondasi database PostgreSQL mandiri untuk tim backend, frontend, BA, QA, serta dokumentasi/UAT.

Repository remote masih kosong ketika diperiksa pada **6 November 2026**: tidak ada README, backend/frontend, ORM, migration, dependency, atau branch existing. Karena itu tidak ada stack aplikasi atau autentikasi yang diganti. Implementasi menggunakan **PostgreSQL 18 + SQL + Python 3.9+ stdlib + psql**, tanpa membuat framework aplikasi baru.

## Mulai

Ikuti [setup database](docs/database/SETUP.md) untuk menyiapkan PostgreSQL, akun migrator dan runtime yang terpisah.

```sh
export PGHOST=127.0.0.1 PGPORT=5432 PGDATABASE=bsc_admissions PGUSER=bsc_migrator
# Autentikasi melalui .pgpass/secret manager, bukan password dalam source control.
make migrate
make seed
make status
```

Untuk tes integrasi, gunakan kredensial DBA pada **cluster development terisolasi**. Runner selalu membuat database scratch baru; tidak mereset database aplikasi.

```sh
make check
make test
```

## Isi kontribusi

- `database/migrations/`: dua migration SQL berpasangan up/down, 12 tabel inti, constraint, indeks, trigger, fungsi alur dan akses.
- `database/seeds/`: tiga role, lima jurusan dan empat jenis dokumen; tanpa akun default.
- `database/bootstrap/`: hak akses database untuk runtime dan layanan autentikasi.
- `scripts/`: runner migration transaksional/checksum dan pengujian database nyata.
- `tests/`: pengujian constraint, ownership, RBAC, alur pendaftaran dan pengumuman privat.
- `docs/database/`: [ERD](docs/database/ERD.md), [data dictionary](docs/database/DATA_DICTIONARY.md), [setup](docs/database/SETUP.md), [keamanan](docs/database/SECURITY.md), [keputusan desain](docs/database/DESIGN.md), [kontrak integrasi](docs/database/INTEGRATION.md), dan [hasil pengujian](docs/database/TEST_RESULTS.md).

Login HTTP, hashing/verifikasi password, sesi, upload file, endpoint dan UI belum tersedia di repository ini. Fungsi database menerima identitas dari **backend tepercaya** dan bukan pengganti autentikasi. Batas tanggung jawabnya dijelaskan dalam dokumentasi keamanan/integrasi.
