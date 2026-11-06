# Kontrak integrasi tim

## Fadlan — Backend

Belum ada backend/ORM untuk diintegrasikan pada branch dasar. Gunakan PostgreSQL ini sebagai database utama. Bila backend kemudian memakai ORM, petakan tabel/fungsi existing; jangan membuat skema kredensial/database kedua atau mengedit migration yang sudah dipakai. Migrasi framework perlu baseline yang disepakati tim.

Pool aplikasi memakai login anggota `bsc_runtime`; pool autentikasi memakai login anggota `bsc_authenticator`, dengan ukuran dan secret terpisah. Lookup email hanya untuk komponen autentikasi. Validasi hash Argon2id dilakukan library backend, lalu cek account_status dan bangun sesi. Setelah login, aktor berasal dari sesi server; tidak dari body/query/header yang dipilih pengguna. Endpoint dan objek tetap diotorisasi server.

Semua nama parameter berikut menggunakan tipe SQL asli. Cast smallint/bigint pada bind parameter jika driver tidak menyimpulkannya. Fungsi berjalan dalam transaksi pemanggil; commit/rollback harus diselesaikan backend. Retry terbatas `40001`/`40P01`, bukan retry semua error. Jangan jalankan SQL dengan concatenation.

| Fungsi | Parameter | Hasil/perilaku |
|---|---|---|
| `bsc_auth.lookup_account` | email text | Row id/hash/role/status/password_changed_at; hanya auth pool |
| `bsc_api.register_account` | email text, password_hash text | UUID akun applicant; tidak menerima role |
| `bsc_api.replace_password_hash` | actor uuid, hash text | Ganti hash sendiri setelah reautentikasi backend |
| `bsc_api.save_profile` | actor uuid, full_name text, birthplace text, birth_date date, gender text, address text, phone text | UUID profil sendiri; upsert saat diizinkan |
| `bsc_api.get_catalog` | tanpa parameter | JSONB majors/periods/document_types aktif |
| `bsc_api.create_application` | actor uuid, period uuid, major smallint | UUID draft; batas satu per siswa/periode |
| `bsc_api.change_major` | actor uuid, application uuid, major smallint | Ganti pilihan pada draft/perbaikan |
| `bsc_api.put_document` | actor uuid, application uuid, type smallint, storage_key text, mime_type text, size_bytes bigint | UUID slot; penggantian wajib key baru; pending/revision++ |
| `bsc_api.change_application_status` | actor uuid, application uuid, status text, note text default NULL | Transisi sesuai matriks/state machine |
| `bsc_api.verify_document` | actor uuid, document uuid, status text, note text default NULL | approved/correction_requested; hanya saat under_review |
| `bsc_api.save_selection_result` | actor uuid, application uuid, outcome text, note text, announcement_at timestamptz | UUID hasil draft; hanya admin |
| `bsc_api.publish_selection_result` | actor uuid, application uuid | Publish eksplisit sesudah jadwal + completed |
| `bsc_api.get_application` | actor uuid, application uuid | JSONB terbatas ownership/role, hasil privat |
| `bsc_api.list_applications` | actor uuid, period uuid default NULL, limit integer default 50, offset integer default 0 | Row id/registration_number/period_id/major_id/status/created_at; limit 1–100 |
| `bsc_api.manage_account` | actor uuid, user uuid, role text, status text | Admin mengelola akun lain; siswa berprofil tetap applicant |

Contoh query dengan bind parameter PostgreSQL, bukan interpolasi data ke SQL:

```sql
PREPARE owned_application(uuid, uuid) AS
    SELECT bsc_api.get_application($1, $2);
PREPARE submit_application(uuid, uuid) AS
    SELECT bsc_api.change_application_status($1, $2, 'submitted');
```

Driver aplikasi dapat langsung mengirim statement yang sama dengan parameter array; PREPARE di atas hanya memperjelas batas data/query. `tests/database/integrity.sql` mengeksekusi prepared query dengan payload injection pada input sintetis.

Pemetaan error yang disarankan: `42501` → 403 atau 404 generik sesuai endpoint (jangan bocorkan keberadaan objek), `23505` → 409 generik, `23514`/`23502`/`23503`/`23001`/`22P02` → 400/422 generik, lainnya → 500 dengan request ID aman. Jangan mengirim SQLSTATE/detail constraint/row/hash mentah ke client. Error login tidak membedakan akun ada atau tidak.

Upload: server memeriksa sesi/ownership/state, menerima file ke bucket privat staging, memeriksa isi/MIME/ukuran/malware, membentuk key acak, lalu memanggil put_document. DB tidak dapat memeriksa isi object storage. Download memakai get_application untuk ownership dan link privat pendek/stream server; jangan menyediakan endpoint publik berdasarkan storage_key saja. Jangan menerima key milik siswa lain dari client.

## Hafizd — Frontend

Gunakan kode referensi dari get_catalog, bukan ID identity hardcoded. TJKT satu-satunya kode kanonis; tampilkan nama program dari katalog. Status literal API tersedia di dictionary/state machine. Draft dapat belum lengkap; submit memerlukan tujuh field biodata dan tiga dokumen wajib. `get_application` memberi `application`, `profile`, `documents`, `history`, `verifications`, `selection_result`. Result JSON null berarti belum tersedia bagi aktor; jangan menyimpulkan gagal seleksi.

Jangan menampilkan hash, detail error SQL, storage key sebagai tautan publik, atau role kontrol UI sebagai pengaman utama. Saat selesai, profil yang dibaca dari aplikasi adalah snapshot formulir; halaman edit profil berikutnya perlu endpoint profil tersendiri jika dibutuhkan. Belum ada kontrak HTTP, URL endpoint, OpenAPI, atau komponen UI pada kontribusi ini.

## Samuel — BA/UI/UX

Sahkan nama lima jurusan/TJKT, tiga dokumen wajib, batas upload, role panitia lintas periode, gender/telepon, tenggat perbaikan, kebijakan penarikan dan waitlist, retensi PII serta jalur ralat hasil. Kebutuhan yang mengubah state machine/constraint harus melalui migration berikutnya. Aktifkan periode hanya setelah tanggal dan persyaratan disetujui.

## Rizki — QA/DevSecOps

Jalankan make test pada PostgreSQL 18 terisolasi. Aktifkan template docs/database/ci-workflow.yml melalui akun dengan izin workflow; CI belum aktif karena keterbatasan scope token push. Sesudah backend tersedia, tambahkan tes HTTP: akun A mencoba ID aplikasi/dokumen B, actor spoofing, role escalation, hasil belum diumumkan, akun suspended, credential stuffing/rate limit, sesi usai ganti password, file palsu/berbahaya, error redaction dan race upload/submit. Pastikan runtime bukan owner/superuser dan authenticator tidak digunakan untuk query UI. Verifikasi TLS/network, secrets, bucket privat, retensi log dan restore backup. Tes DB saat ini tidak mengklaim hal-hal tersebut lulus.

## Taqqy — Dokumentasi/UAT

Gunakan fixture sintetis SQL tes dan buat akun melalui backend dengan password acak, bukan seed admin default. Alur UAT: draft → kirim → review → perbaikan → kirim ulang → verifikasi → seleksi → publish; siswa lain tetap ditolak. Tes memakai domain `example.test`, data fiktif dan metadata file tanpa isi dokumen. Fixture berada dalam transaksi rollback; tidak meninggalkan akun UAT permanen. Data UAT persisten dibuat terpisah pada lingkungan yang disetujui dengan secret yang tidak di-commit.
