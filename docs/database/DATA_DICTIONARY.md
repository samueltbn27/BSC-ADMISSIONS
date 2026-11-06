# Data Dictionary

Skema bisnis `bsc`. `N` pada nullable berarti `NOT NULL`; `Y` berarti boleh NULL. Seluruh FK menggunakan `ON UPDATE RESTRICT ON DELETE RESTRICT`. UUID PK memakai `gen_random_uuid()`, kecuali kode role. Semua waktu `timestamptz`; `now()` sebagai default, dan trigger mengubah `updated_at` pada UPDATE. Panjang teks divalidasi CHECK walau tipe SQL-nya `text`.

## roles — peran akun

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| code | text | N | PK; applicant/committee/admin | Kode role stabil |
| name | text | N | Panjang trim 1–80 | Label peran |

## users — identitas autentikasi

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK; UUID acak | Identitas akun |
| email | text | N | UNIQUE; lowercase/trim, pola email, max 254 | Identitas login ternormalisasi |
| password_hash | text | N | PHC Argon2id v19; 90–512 karakter; m=19456–1048576 KiB, t=2–20, p=1–16 | Hash dari backend; bukan plaintext |
| role_code | text | N | FK roles.code; default applicant | Peran akun |
| account_status | text | N | active/suspended/closed; default active | Pengendalian akses akun |
| password_changed_at | timestamptz | N | Default now() | Batas invalidasi sesi oleh backend |
| created_at | timestamptz | N | Default now() | Waktu dibuat |
| updated_at | timestamptz | N | Default now(); trigger | Waktu pembaruan |

## applicant_profiles — biodata hidup calon siswa

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK | Identitas profil |
| user_id | uuid | N | FK users.id; UNIQUE; trigger wajib role applicant | Ownership 1:1 |
| full_name | text | N | Panjang trim 1–150 | Nama lengkap |
| birthplace | text | Y | Panjang trim 1–100 | Tempat lahir |
| birth_date | date | Y | ≥1900-01-01; trigger ≤CURRENT_DATE | Tanggal lahir |
| gender | text | Y | L/P | Jenis kelamin sesuai formulir awal |
| address | text | Y | Panjang trim 1–1000 | Alamat |
| phone | text | Y | E.164: + diikuti 8–15 digit, digit awal bukan nol | Kontak calon siswa |
| created_at | timestamptz | N | Default now() | Waktu dibuat |
| updated_at | timestamptz | N | Default now(); trigger | Waktu pembaruan |

Field nullable memungkinkan draft; fungsi submit mewajibkan seluruh field biodata. Tidak ada NIK/NISN.

## majors — program keahlian

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | smallint | N | PK; GENERATED ALWAYS AS IDENTITY | ID referensi |
| code | text | N | UNIQUE; huruf besar/angka 2–16; TKJT ditolak | TJKT/PPLG/ANIMASI/MPLB/OTOMOTIF |
| name | text | N | UNIQUE; panjang trim 1–150 | Nama keahlian |
| description | text | Y | Max 2000 | Penjelasan jurusan |
| is_active | boolean | N | Default true | Boleh dipilih untuk aplikasi baru |

## admission_periods — periode penerimaan

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK | Identitas periode |
| name | text | N | Panjang trim 1–100; UNIQUE bersama academic_year | Nama gelombang/periode |
| academic_year | text | N | YYYY/YYYY; tahun kedua = tahun pertama +1 | Tahun ajaran |
| opens_at | timestamptz | N | Harus sebelum closes_at | Awal penerimaan inklusif |
| closes_at | timestamptz | N | Harus setelah opens_at | Batas penerimaan eksklusif |
| is_active | boolean | N | Default false | Sakelar periode |

## applications — formulir dan status terkini

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK | Identitas aplikasi |
| applicant_profile_id | uuid | N | FK applicant_profiles.id; UNIQUE bersama period_id | Pemilik aplikasi |
| period_id | uuid | N | FK admission_periods.id | Periode tujuan |
| major_id | smallint | N | FK majors.id | Pilihan keahlian |
| registration_number | text | N | GENERATED STORED `BSC-` + UUID tanpa tanda hubung huruf besar; UNIQUE | Nomor pendaftaran |
| status | text | N | Default draft; delapan nilai CHECK di bawah | Status terkini |
| submitted_at | timestamptz | Y | NULL pada draft; wajib pada status proses setelah submit | Pengiriman pertama |
| profile_snapshot | jsonb | Y | Object; wajib pada status proses setelah submit | Biodata tujuh field saat pengiriman terakhir |
| created_at | timestamptz | N | Default now() | Waktu dibuat |
| updated_at | timestamptz | N | Default now(); trigger | Waktu pembaruan |

Status: `draft`, `submitted`, `under_review`, `correction_requested`, `verified`, `selection_in_progress`, `completed`, `withdrawn`. Withdrawn boleh belum/sudah submit. Snapshot dibuat fungsi, bukan menerima JSON client.

## document_types — konfigurasi persyaratan

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | smallint | N | PK; identity | Identitas jenis |
| code | text | N | UNIQUE; snake_case 2–40 | Kode API stabil |
| name | text | N | Panjang trim 1–100 | Label dokumen |
| is_required | boolean | N | Default false | Wajib saat submit/verifikasi |
| is_active | boolean | N | Default true | Dipakai pada requirement aktif |
| max_size_bytes | bigint | N | 1–20971520; default 5242880 | Batas ukuran per jenis |
| allowed_mime_types | text[] | N | Tidak kosong/NULL elemen; subset PDF/JPEG/PNG | Allowlist MIME per jenis |

## application_documents — metadata slot berkas privat

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK; UNIQUE bersama application_id | Identitas slot berkas |
| application_id | uuid | N | FK applications.id; UNIQUE bersama document_type_id | Pemilik dokumen |
| document_type_id | smallint | N | FK document_types.id | Kategori berkas |
| storage_key | text | N | UNIQUE; key applications/UUID/UUID; prefix harus cocok aplikasi | Referensi object privat |
| mime_type | text | N | application/pdf, image/jpeg, image/png; cocok allowlist jenis | Klaim MIME; isi tetap diperiksa backend |
| size_bytes | bigint | N | 1–20 MiB; trigger ≤batas per jenis | Ukuran byte |
| verification_status | text | N | pending/approved/correction_requested; default pending | Status revisi terkini |
| revision | integer | N | >0; default 1; bertambah saat ganti object | Versi slot |
| uploaded_at | timestamptz | N | Default now(); diperbarui saat penggantian | Waktu unggah revisi terkini |

## verification_records — catatan pemeriksaan append-only

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK | Identitas pemeriksaan |
| application_id | uuid | N | FK applications.id | Cakupan aplikasi |
| document_id | uuid | Y | FK komposit (document_id,application_id) → application_documents(id,application_id) | NULL berarti review aplikasi |
| document_revision | integer | Y | >0; NULL iff document_id NULL | Revisi yang diperiksa |
| verified_by | uuid | N | FK users.id | Aktor panitia/admin; diverifikasi fungsi |
| status | text | N | approved/correction_requested | Keputusan review |
| note | text | Y | Trim 1–1000; wajib saat correction_requested | Catatan perbaikan aman |
| verified_at | timestamptz | N | Default now() | Waktu pemeriksaan |

## application_status_history — histori append-only

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK | Identitas event |
| application_id | uuid | N | FK applications.id | Aplikasi terkait |
| previous_status | text | Y | Delapan status CHECK; berbeda dari new_status | NULL pada pembuatan |
| new_status | text | N | Delapan status CHECK | Status tujuan |
| changed_by | uuid | N | FK users.id | Aktor dari sesi backend |
| note | text | Y | Trim 1–1000 | Alasan perubahan; jangan isi PII berlebih |
| changed_at | timestamptz | N | Default now() | Waktu kejadian |

## selection_results — keputusan dan publikasi privat

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK | Identitas keputusan |
| application_id | uuid | N | FK applications.id; UNIQUE | Satu hasil per aplikasi |
| outcome | text | N | accepted/waitlisted/rejected | Hasil seleksi |
| note | text | Y | Trim 1–1000 | Keterangan siswa |
| announcement_at | timestamptz | N | Batas terawal publish | Jadwal pengumuman |
| published_at | timestamptz | Y | NULL sebelum publish; ≥announcement_at | Waktu publikasi eksplisit |
| decided_by | uuid | N | FK users.id | Admin pembuat keputusan |
| created_at | timestamptz | N | Default now() | Waktu dibuat |
| updated_at | timestamptz | N | Default now(); trigger | Waktu pembaruan |

## audit_logs — audit minimal append-only

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| id | uuid | N | PK | Identitas event |
| actor_id | uuid | N | FK users.id | Aktor operasi |
| action | text | N | CHECK allowlist 12 action | Jenis event |
| entity_type | text | N | user/profile/application/document/result | Jenis target |
| entity_id | uuid | N | Target generik; bukan FK polimorfik | Identitas target event |
| occurred_at | timestamptz | N | Default now() | Waktu kejadian |

Action: `account_created`, `account_updated`, `profile_saved`, `application_created`, `major_changed`, `status_changed`, `document_uploaded`, `document_verified`, `application_verified`, `result_saved`, `result_published`, `password_changed`. Tidak ada payload bebas, email, token, hash, alamat, atau isi file pada audit.

## bsc_meta.migrations — ledger deployment

| Kolom | Tipe | Nullable | Kunci/constraint/default | Fungsi |
|---|---|---|---|---|
| version | text | N | PK | Nama migration |
| up_checksum | text | N | SHA-256 sumber up | Deteksi perubahan file yang sudah diterapkan |
| down_checksum | text | N | SHA-256 sumber down | Deteksi perubahan rollback |
| applied_at | timestamptz | N | Default now() | Waktu penerapan |

Ledger dan fungsi internal tidak dapat diakses runtime. [Migration SQL](../../database/migrations/001_schema.up.sql) adalah sumber definitif constraint/indeks.
