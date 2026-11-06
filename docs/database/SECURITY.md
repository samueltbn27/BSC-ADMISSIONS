# Secure by Design dan batas tanggung jawab

Implementasi database mendukung tiga kontrol K1–K3. Tidak ada backend, login HTTP, token atau endpoint existing yang dapat diintegrasikan/diuji pada repository kosong ini. Fungsi SQL adalah kontrak integrasi yang dapat dipakai backend berikutnya; kontrol autentikasi endpoint belum dinyatakan selesai.

## K1 — Secure Authentication

**Diterapkan:** email UNIQUE dan normalisasi lower/trim saat registrasi/lookup; CHECK format email; `password_hash` wajib PHC Argon2id v19 dengan batas parameter m/t/p; tidak ada kolom password plaintext, seed akun, administrator default atau secret. Role runtime tidak dapat membaca tabel kredensial/lookup auth. `bsc_authenticator` terpisah hanya dapat menjalankan `lookup_account`; hash tidak dikembalikan API aplikasi. Status akun active diperiksa pada operasi terautentikasi; password_changed_at mendukung invalidasi sesi.

**Backend wajib:** hash/verifikasi menggunakan library Argon2id terawat, salt acak per password, cost yang dibenchmark (baseline m=65536 KiB, t=3, p=1 kompatibel dengan constraint); validasi panjang password sebelum hash; rehash saat parameter berubah. CHECK PHC hanya memvalidasi format/parameter, tidak membuktikan asal hash atau kekuatan password. Konstanta PHC dalam tes adalah fixture sintaksis, bukan akun yang bisa dipakai login atau tes kriptografi.

Backend harus mengatur sesi/cookie aman, CSRF sesuai arsitektur, rate limit, verifikasi email, pemulihan akun, expiry/revokasi sesi dan error login generik. Auth lookup belum membedakan respons HTTP email ada/tidak; backend wajib mencegah enumerasi. `replace_password_hash` hanya dipanggil setelah reautentikasi/current password atau recovery yang sah; perubahan waktu hash harus membatalkan sesi lama. Jangan mengirim hash ke frontend.

## K2 — RBAC dan ownership

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

**Diterapkan:** FK ownership, role lookup, account_status, pemeriksaan fungsi per aktor/objek/status, grants default-deny pada schema/tabel/fungsi, larangan update/delete audit/histori oleh runtime. `SECURITY DEFINER` menggunakan search_path tetap `pg_catalog,bsc,pg_temp`; schema bsc tidak dapat ditulis runtime. Fungsi tidak memakai SQL dinamis dari input. Pemilik migration harus role khusus non-superuser di produksi. Akses authenticator dipisah dari runtime. Akun suspended/closed ditolak oleh guard.

**Batas kepercayaan kritis:** parameter `p_actor` harus diambil backend dari sesi yang telah diverifikasi. Login SQL runtime adalah layanan tepercaya untuk banyak pengguna; siapa pun yang menguasai login ini dapat menyamar sebagai aktor lain saat memanggil fungsi. Menyembunyikan UUID bukan otorisasi. PostgreSQL tidak dibuka langsung kepada browser/pengguna, dan backend tidak menerima actor/role dari request body/query. Backend tetap memeriksa authorization endpoint dan objek sebelum memanggil database; fungsi menjadi lapis pemeriksaan tambahan dengan identitas tepercaya yang diberikan server.

**Evaluasi RLS:** belum diterapkan karena belum ada arsitektur identitas/sesi untuk mengikat user aplikasi ke principal PostgreSQL. RLS berdasarkan custom GUC user_id yang dapat di-set login runtime akan dapat dipalsukan oleh login yang sama. Fungsi tertutup dan pemisahan privilege dipilih sebagai batas akses server tepercaya. Jika tim memilih gateway JWT terverifikasi/principal DB per user, desain RLS harus ditinjau ulang dan diuji, termasuk owner/superuser bypass. Tidak mengklaim database sendirian mengamankan endpoint.

## K3 — Input Validation dan SQL Injection Prevention

**Diterapkan:** UUID, DATE, timestamptz, boolean, bigint; NOT NULL, UNIQUE, FK, CHECK enum, pola email/E.164, batas ukuran/MIME, range tanggal, urutan periode, catatan wajib perbaikan, state machine, dan publication gate. Dokumen memiliki FK komposit agar pemeriksaan tidak menunjuk berkas aplikasi lain. Operasi multi-tabel atomik; row/advisory lock menjaga perubahan paralel. Runner memakai file SQL tepercaya dengan checksum; satu-satunya SQL dinamis pada migration membentuk identifier tabel dari daftar konstan dengan `%I`.

Tes injection memakai PREPARE/parameter berisi metakarakter sebagai data dan memeriksa tabel tetap utuh. Itu tidak menguji endpoint HTTP yang belum tersedia. Backend wajib memakai ORM/query bind parameter, bukan interpolasi string; validasi server sebelum query dan pesan 4xx/5xx generik tanpa nama tabel, stack trace, input atau hash. Runner menutupi stderr SQL yang dapat memuat nilai; DBA menginvestigasi lewat jalur privat. Parameter keamanan bukan pengganti validasi konten file.

## Data pribadi dan dokumen

- Biodata/snapshot dan berkas keluarga adalah PII: TLS verify-full saat remote, volume/backup terenkripsi, akses dibatasi role layanan dan DBA yang ditunjuk. Tidak menambah NIK/NISN.
- Storage key memakai UUID, tidak memuat nama siswa; tidak ada public URL atau nama file asli dalam DB. Prefix key harus cocok application_id. Key bukan bukti hak akses dan tidak berarti object store sudah privat.
- Backend memverifikasi ownership saat upload/download, mendeteksi MIME dari konten, mengukur ukuran nyata, melakukan pemindaian malware, dan menulis object hanya lewat server. Bucket privat serta link sementara singkat hanya setelah authorization. Metadata baru dicatat setelah upload tervalidasi; kegagalan transaksi/orphan object ditangani job pembersihan terkontrol.
- Penggantian reset pending dan menaikkan revisi; verifikasi menyimpan nomor revisi. Retensi semua file/metadata versi lama belum diimplementasikan.
- Audit hanya aktor/action/jenis+ID target/waktu. Catatan bebas pada verifikasi/histori/hasil dibatasi 1000 karakter dan perlu validasi/redaksi backend; jangan isi password, token, diagnosis, atau data keluarga yang tidak perlu. Akses baca PII oleh panitia belum tercatat otomatis; tambahkan audit akses pada endpoint sesuai kebijakan sekolah.
- Penghapusan akun ditahan FK; gunakan status closed. Masa retensi, anonimisasi/penghapusan terkontrol, akses siswa/orang tua dan persetujuan perlu ditetapkan sekolah sebelum produksi. Menutup akun bukan menghapus data.

## Konfigurasi dan pemulihan

Tidak ada password/token di `.env.example`, seed atau migration. `.env`, `.local`, dump, log dan cache diabaikan Git. Gunakan secret manager/.pgpass 0600. Batasi jaringan DB ke backend/DBA, jangan gunakan migration role saat runtime, jangan log bind values atau hash. Backup/restore dan target RPO/RTO masih rancangan operasional; [setup](SETUP.md) memuat prosedur. Koneksi trust hanya untuk scratch/CI terisolasi, bukan deployment.

## Bukti dan sumber desain

[Hasil tes nyata](TEST_RESULTS.md) membedakan pengujian database dari pekerjaan backend yang belum tersedia. Rujukan primer yang digunakan: [PostgreSQL CREATE FUNCTION — keamanan SECURITY DEFINER](https://www.postgresql.org/docs/18/sql-createfunction.html), [Row Security Policies](https://www.postgresql.org/docs/18/ddl-rowsecurity.html), [Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html), dan [ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/18/sql-alterdefaultprivileges.html). Default EXECUTE dicabut secara global untuk role migrator khusus di database ini karena pencabutan per-schema tidak dapat mengurangi grant default global. Tidak mengklaim penetration test, audit regulasi atau keamanan produksi lengkap.
