# Laporan Implementasi Keamanan Aplikasi

Kontrol keamanan ini melengkapi kontrol database existing ([SECURITY.md](../database/SECURITY.md)).

## K1 — Secure Authentication

- **Argon2id** (PHC `$argon2id$v=19$m=65536,t=3,p=1$...`) via `hash-wasm`
  (WASM, tanpa binary native). Parameternya memenuhi CHECK di tabel `users`.
- Salt acak 16 byte per password; verifikasi memakai `timingSafeEqual`.
- **Sesi server**: token acak 32 byte disimpan di memori server (Map), cookie `HttpOnly`,
  `SameSite=Lax`, `Secure` saat produksi. Tidak ada token di localStorage.
- Sesi diperpanjang bergulir; logout menghapus sesi server dan cookie.
- Rate limit: 10 percobaan/menit pada `/auth/*` per IP.
- Pesan login generik (tidak membocorkan keberadaan akun).
- Akun `suspended`/`closed` ditolak (dicek di fungsi DB maupun service).

## K2 — Role-Based Access Control

- Middleware `requireAuth` + `requireRole` di backend (default deny).
- Verifikasi ownership di fungsi DB (`bsc_api.get_application`, `get_document`, dll.):
  siswa hanya bisa melihat/mengubah miliknya sendiri.
- Frontend hanya menyembunyikan menu; backend yang menegakkan akses.

## K3 — Input Validation & SQL Injection Prevention

- Zod di semua body/query endpoint; pesan error generik.
- Semua operasi DB melalui fungsi `bsc_api.*` dengan parameterized query — tidak ada
  interpolasi string SQL dari input pengguna.
- Field yang dapat diperbarui dibatasi per endpoint (anti mass assignment).
- Tidak ada rendering HTML mentah dari input pengguna (React escape by default).

## Keamanan tambahan

- **File upload**: pemeriksaan magic bytes (PDF/JPG/PNG), batas ukuran per jenis dokumen,
  nama acak UUID, disimpan di luar direktori publik (`backend/storage/uploads`, gitignored),
  download hanya lewat endpoint berotorisasi.
- **CSRF**: guard memvalidasi `Origin`/`Referer` pada semua method mutasi.
- **Helmet** (security headers), `x-powered-by` dimatikan.
- **Audit log** di database (append-only) untuk aksi penting; response tidak pernah
  memuat hash/email/isi file.
- **Secret handling**: `.env` di-ignore; `.env.example` hanya placeholder; tidak ada
  secret yang di-commit.

## Keterbatasan yang didokumentasikan

- Sesi in-memory hilang saat server restart (untuk produksi gunakan Redis/DB store).
- Verifikasi email & reset password belum tersedia (tanpa infrastruktur SMTP).
- Upload tidak memindai malware (perlu integrasi antivirus di produksi).
- Retensi PII/anonimisasi akun mengikuti kebijakan sekolah (lihat SECURITY.md database).
