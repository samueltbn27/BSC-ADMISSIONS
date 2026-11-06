# Hasil pengujian database

Tanggal: **6 November 2026 (Asia/Jakarta)**. Lingkungan: macOS ARM64, PostgreSQL **18.6**, Python **3.9.6**, psql **18.6**. Database memakai cluster development baru di `.local/pgdata`, socket privat, port 55439 dan tanpa listener TCP. Bukan database tim/produksi.

## Perintah yang benar-benar dijalankan

Dari root repository BSC-ADMISSIONS:

```sh
PGHOST="$PWD/.local" PGPORT=55439 python3 scripts/test_database.py
make check
```

Runner membuat database baru dan owner NOLOGIN/non-superuser untuk setiap run. Migration/seed/rollback dieksekusi dengan role owner terbatas, sedangkan pembuatan database/role dan pemeriksaan privilege memakai DBA cluster tes. Run lokal terakhir berhasil dengan **76 assertion SQL + 3 unit test**. Scratch terakhir: `bsc_test_45d5ffcae426483394c5a6f58de8c233`. Fixture tidak memuat data nyata atau password yang dapat dipakai.

| Pemeriksaan | Hasil | Bukti/cakupan |
|---|---|---|
| Migration dari kosong | PASS | 001 dan 002 dengan owner non-superuser |
| Dua proses migrate bersamaan | PASS | Advisory lock menserialisasi deploy |
| Migrate ulang | PASS | Tidak membuat duplikasi; checksum diverifikasi |
| Seed dua kali | PASS | 3 role, 5 jurusan, 4 jenis; tanpa akun default |
| Bootstrap dua kali | PASS | Grant idempotent dan capability terpisah |
| PK/UNIQUE/FK | PASS | UUID unik, email ternormalisasi, satu aplikasi/periode, FK aplikasi/major, FK komposit dokumen |
| Validasi input | PASS | Plaintext/Argon lemah, email, tanggal lahir, telepon, gender, periode, status, MIME, ukuran, key publik ditolak |
| Workflow | PASS | Draft, kirim, review, perbaikan, resubmit, verifikasi, seleksi, publish; histori lengkap |
| Transaksi atomik | PASS | Kegagalan insert histori membatalkan update status |
| Dokumen | PASS | Penggantian menaikkan revisi; verifikasi menyimpan revisi historis |
| Ownership/RBAC | PASS | Baca/tulis lintas siswa ditolak, staff queue, self-escalation ditolak, akun suspended ditolak |
| Least privilege | PASS | Runtime tidak dapat baca hash/DML tabel/private helper; auth role terpisah |
| Default fungsi baru | PASS | Fungsi baru tidak mendapat PUBLIC EXECUTE |
| Pengumuman privat | PASS | Belum publish tersembunyi; jadwal ditegakkan; setelah publish tetap ditolak untuk siswa lain |
| Snapshot formulir | PASS | Perubahan profil setelah completed tidak mengubah biodata formulir lama |
| Parameterized query/injection | PASS | PREPARE dengan payload SQL sebagai nilai; 12 tabel tetap utuh |
| Rollback/reapply | PASS | 002 down, 001 down, skema hilang, migrate/seed ulang |
| Rollback dengan data bisnis | PASS | Ditolak; data dan ledger tidak berubah |
| Checksum rusak | PASS | Migrate menolak ledger checksum yang sengaja diubah pada scratch |
| Unit runner | PASS | 3 tes: quoting literal, izin eksplisit rollback, penyamaran error SQL |
| Whitespace Git | PASS | `git diff --check` / staged diff sebelum commit |

Tes FK RESTRICT mengharapkan SQLSTATE `23001` pada PostgreSQL 18 untuk penghapusan yang dibatasi; pelanggaran FK insert menggunakan `23503`. Hash PHC fixture menguji batas penyimpanan, bukan hash/verifikasi password secara kriptografi.

## CI

Template [ci-workflow.yml](ci-workflow.yml) menyiapkan PostgreSQL 18 disposable, Python 3.12, lalu menjalankan `make check` dan `make test`. **CI belum diaktifkan/dijalankan.** Push awal dengan workflow aktif ditolak GitHub karena token HTTPS tidak memiliki scope `workflow`; SSH juga tidak memiliki key yang diterima. Push atomik tersebut tidak mengubah remote. Template dipindahkan ke dokumentasi agar implementasi database dapat dipublikasikan dengan izin yang tersedia.

Maintainer/QA dengan izin workflow dapat menyalin template ke `.github/workflows/database.yml` pada PR lanjutan. Hasil lokal di atas tidak dinyatakan sebagai hasil CI. Container trust hanya dipakai pada service CI terisolasi.

## Belum diuji / belum tersedia

- Endpoint HTTP, session/token, Argon2 library, CSRF, rate limit, reset password dan invalidasi sesi: backend belum ada.
- Authorization HTTP, actor spoofing di endpoint dan SQL injection melalui API HTTP: belum ada endpoint. Boundary `p_actor` tetap tanggung jawab server tepercaya.
- File upload/download nyata, deteksi MIME isi, antivirus, ACL bucket/signed URL: object storage belum diintegrasikan.
- Backup/restore/PITR, beban produksi, failover, RPO/RTO, retensi/anonimisasi PII: prosedur tersedia, eksekusi belum dilakukan.
- Kompatibilitas server selain PostgreSQL 18 dan ORM/backend yang akan dipilih tim: belum diuji.

Tidak ada reset, TRUNCATE, force push atau penghapusan database existing. Scratch database/role tes tetap ada dalam cluster privat untuk inspeksi; test checksum terakhir sengaja meninggalkan ledger yang tidak cocok, sehingga scratch tidak boleh dipakai sebagai database aplikasi.
