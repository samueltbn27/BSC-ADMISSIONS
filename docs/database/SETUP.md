# Setup, migration, seed, dan operasi

## Dependency

- PostgreSQL **18** server/client (diuji dengan 18.6). Fitur tidak memerlukan extension eksternal.
- Python **3.9+** (stdlib), `psql` pada PATH, dan opsional GNU/BSD make.
- Tidak ada Node/Laravel/ORM existing dan tidak menambah dependency Python eksternal. Tidak ada frontend/backend baru.

Instal PostgreSQL melalui package manager resmi platform atau gunakan cluster PostgreSQL development yang sudah disiapkan DBA. Contoh macOS: `brew install postgresql@18`, kemudian tambahkan `$(brew --prefix postgresql@18)/bin` ke PATH. Jangan menimpa symlink libpq existing dengan force; perintah binari absolut dapat digunakan bila ada konflik instalasi.

## Cluster lokal terisolasi

Perintah berikut hanya untuk cluster **baru** pada `.local/pgdata` yang belum ada. Jalankan dari root repository. Direktori `.local/` diabaikan Git. `initdb` tidak boleh dijalankan sebagai root.

```sh
mkdir -p .local
chmod 700 .local
initdb -D .local/pgdata --auth-local=peer --auth-host=scram-sha-256 --encoding=UTF8
pg_ctl -D .local/pgdata -l .local/server.log \
  -o "-k $PWD/.local -p 55439 -c listen_addresses='' -c log_statement=none -c log_min_error_statement=panic -c log_parameter_max_length_on_error=0" start
export PGHOST="$PWD/.local" PGPORT=55439
```

Peer auth memakai user OS; nama superuser cluster default sama dengan user OS. Untuk development dengan beberapa login SQL, siapkan `pg_hba.conf` memakai SCRAM pada koneksi yang sesuai dan gunakan `.pgpass`. Jangan melonggarkan autentikasi cluster bersama. Tes pada mesin implementasi memakai socket dalam direktori privat dan local-trust pada cluster scratch khusus, tanpa listener TCP; trust tersebut bukan konfigurasi deployment.

Matikan cluster ini setelah selesai:

```sh
pg_ctl -D .local/pgdata stop -m fast
```

## Akun deployment dan database

Jalankan menggunakan DBA pada database `postgres`. Gunakan prompt `\password`/secret manager, jangan memasukkan password ke perintah shell atau file SQL yang di-commit.

```sql
CREATE ROLE bsc_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
\password bsc_migrator
CREATE DATABASE bsc_admissions OWNER bsc_migrator;
```

Konfigurasikan autentikasi koneksi yang cocok dengan login tersebut. Untuk SCRAM, simpan credential di `~/.pgpass` dengan permission `0600`, atau injeksikan melalui secret manager. Jangan commit file credential. `.env.example` hanya dokumentasi; runner tidak otomatis mengeksekusi atau memuat `.env`.

```sh
export PGHOST=127.0.0.1 PGPORT=5432 PGDATABASE=bsc_admissions PGUSER=bsc_migrator
# Untuk koneksi remote produksi:
export PGSSLMODE=verify-full PGSSLROOTCERT=/path/to/ca.crt
make migrate
make seed
make status
```

Sesuaikan host/port untuk cluster lokal. `PGDATABASE` harus eksplisit; runner menolak target default yang tidak disebut. Jangan jalankan `make migrate/seed` pada database yang belum disetujui. Seed dapat diulang tanpa duplikasi dan **tidak menimpa** perubahan reference yang sudah ada. Seed tidak membuat periode aktif atau akun admin/siswa; hasil simulasi dibuat dalam transaksi tes.

Runner mengeksekusi migration dalam transaksi dan advisory lock, menyimpan checksum SHA-256 up/down pada `bsc_meta.migrations`. Dua deployment yang berlomba diserialisasi. File yang sudah diterapkan jangan diedit; tambahkan migration baru. Error CLI disamarkan agar nilai sensitif tidak tercetak; investigasi detail SQL dilakukan secara privat oleh DBA.

## Privilege runtime/auth

Setelah migration/seed, jalankan sebagai DBA pada database aplikasi:

```sh
psql -X -v ON_ERROR_STOP=1 -f database/bootstrap/privileges.sql
```

Script idempotent membuat role capability **NOLOGIN** `bsc_runtime` dan `bsc_authenticator`, tanpa password. Nama role bersifat cluster-wide; periksa terlebih dahulu pada cluster bersama. Script menolak role existing yang memiliki atribut superuser/createdb/createrole/replication/bypassrls/login, mewarisi role lain, atau memiliki objek di database ini. Gunakan login khusus aplikasi yang hanya menjadi anggota capability yang diperlukan:

```sql
CREATE ROLE bsc_app LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE bsc_auth_login LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
\password bsc_app
\password bsc_auth_login
GRANT bsc_runtime TO bsc_app;
GRANT bsc_authenticator TO bsc_auth_login;
REVOKE CONNECT ON DATABASE bsc_admissions FROM PUBLIC;
GRANT CONNECT ON DATABASE bsc_admissions TO bsc_migrator, bsc_app, bsc_auth_login;
```

Backend tidak memakai login migrator/DBA. Runtime hanya mendapatkan USAGE/EXECUTE pada `bsc_api`, auth login hanya lookup pada `bsc_auth`. Tidak ada DML/SELECT tabel langsung atau CREATE/TEMP untuk PUBLIC di database aplikasi. Jangan berikan membership ke owner/migrator. Ulangi bootstrap sesudah migration yang menambah fungsi; default EXECUTE PUBLIC sudah dicabut dalam migration.

## Periode dan admin awal

Tidak ada admin dengan password default. Akun pertama dibuat melalui `register_account` dengan hash Argon2id yang dihasilkan backend, lalu DBA mempromosikan ID yang telah diverifikasi melalui perubahan operasional yang direview. Jangan menyalin UUID siswa/dummy ke produksi. Selanjutnya admin aktif dapat memanggil `manage_account` untuk akun lain; tidak dapat mengubah role dirinya sendiri atau mengubah siswa yang sudah memiliki profil menjadi staff.

Periode dan persyaratan dikelola migrator/DBA sampai backend menyediakan operasi admin khusus. Contoh periode **nonaktif** untuk disesuaikan dan direview:

```sql
INSERT INTO bsc.admission_periods(name, academic_year, opens_at, closes_at, is_active)
VALUES ('Gelombang 1', '2027/2028', '2027-01-01 00:00:00+07', '2027-07-01 00:00:00+07', false);
```

## Pengujian

```sh
make check    # unit runner + whitespace
# Gunakan DBA development pada cluster terisolasi, bukan role runtime:
make test
```

`make test` membutuhkan pembuatan database, role capability dan `SET ROLE` (direkomendasikan superuser hanya pada cluster tes). Runner mengabaikan PGDATABASE aplikasi dan selalu membuat `bsc_test_<uuid>` serta pemilik NOLOGIN non-superuser `bsc_owner_<uuid>` yang baru, menggunakan database maintenance `postgres`. Migration/seed/rollback dijalankan sebagai pemilik terbatas ini; bootstrap/fixture/SET ROLE memerlukan DBA tes. Host/port/user tetap dari environment. Output mencantumkan nama scratch/owner. Fixture sintetis dibatalkan dengan ROLLBACK; database scratch dan role owner tetap disimpan untuk inspeksi, termasuk satu periode dummy dan checksum yang sengaja dirusak pada tes terakhir. Tidak dipakai sebagai database development aplikasi. Bersihkan melalui prosedur DBA setelah review; runner tidak menghapus database.

Template [CI](ci-workflow.yml) memakai container PostgreSQL 18 disposable, local trust hanya dalam layanan CI. Belum diaktifkan karena autentikasi push tidak memiliki scope workflow; maintainer/QA dapat menyalinnya ke `.github/workflows/database.yml` dengan izin yang sesuai. Hasil lokal dan cakupan pengujian tersedia pada [hasil tes](TEST_RESULTS.md).

## Rollback

```sh
python3 scripts/database.py rollback --allow-destructive
```

Setiap panggilan membatalkan **satu migration terakhir**. `002` menghapus fungsi API/auth saja; backend harus dihentikan/di-drain dan bootstrap diulang setelah reapply. `001` menghapus skema bisnis **hanya jika belum ada users/periode**. Begitu ada data bisnis, rollback schema ditolak dan ledger tetap utuh; gunakan migration koreksi ke depan. Default EXECUTE PUBLIC pada role migrator tetap dicabut setelah rollback untuk mempertahankan hardening; ledger tetap tersedia. Tidak ada reset, TRUNCATE atau penghapusan database dalam tooling. Ambil backup terverifikasi sebelum rollback di luar scratch.

## Backup dan pemulihan

DBA menjadwalkan backup terenkripsi dan WAL/PITR melalui platform database. Tentukan retensi bersama sekolah; target awal yang perlu disahkan: RPO 24 jam/RTO 4 jam, belum merupakan SLA teruji. Backup mencakup PII dan hash: simpan di media privat terenkripsi, akses terbatas, jangan di Git atau folder repository.

```sh
pg_dump -Fc --no-owner --no-acl --file=/secure/backup/bsc-admissions.dump
# Pulihkan hanya ke database restore BARU yang dibuat DBA:
PGDATABASE=bsc_restore_review pg_restore --exit-on-error --no-owner --no-acl \
  --dbname=bsc_restore_review /secure/backup/bsc-admissions.dump
```

Sesudah restore, terapkan kembali ownership/grant/bootstrap yang sesuai, cek jumlah/integritas data dan jalankan smoke test privat. Uji restore berkala dan catat durasi. Backup/restore/PITR belum dieksekusi oleh kontribusi ini. Backup object storage privat perlu kebijakan terpisah yang konsisten dengan metadata DB.
