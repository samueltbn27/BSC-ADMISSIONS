# Dokumentasi API — BSC Admissions

Base URL: `http://localhost:4000/api/v1`. Semua respons berbentuk `{"data": ...}` atau
`{"error": {"code": "...", "message": "...", "requestId": "..."}}`.

Autentikasi memakai cookie sesi `bsc_session` (HttpOnly, SameSite=Lax).
Endpoint mutasi memerlukan header `Origin`/`Referer` yang sesuai (CSRF guard).

## Publik

| Method | Path | Fungsi |
|---|---|---|
| GET | `/catalog` | Katalog publik: jurusan aktif, periode aktif, jenis dokumen |
| GET | `/pengumuman/public` | Pengumuman yang dipublikasikan |

## Autentikasi

| Method | Path | Keterangan |
|---|---|---|
| POST | `/auth/register` | `{email, password}` → akun calon siswa + cookie sesi |
| POST | `/auth/login` | `{email, password}` → cookie sesi |
| POST | `/auth/logout` | Hapus sesi |
| GET | `/auth/me` | Info akun sesi |

## Calon Siswa

| Method | Path | Keterangan |
|---|---|---|
| GET | `/siswa/profil` | Profil milik sendiri |
| PUT | `/siswa/profil` | Simpan/upsert biodata (7 field) |
| GET | `/pendaftaran/me` | Daftar pendaftaran milik sendiri |
| POST | `/pendaftaran` | `{periodId, majorId}` → buat draft |
| GET | `/pendaftaran/:id` | Detail (ownership dicek server) |
| PATCH | `/pendaftaran/:id` | `{majorId}` ganti jurusan (draft/perbaikan) |
| POST | `/pendaftaran/:id/submit` | Kirim pendaftaran |
| POST | `/pendaftaran/:id/withdraw` | Tarik pendaftaran |
| POST | `/dokumen` | Multipart `applicationId, documentTypeId, file` |
| GET | `/dokumen/types` | Jenis dokumen aktif |
| GET | `/dokumen/pendaftaran/:id` | Metadata dokumen |
| GET | `/dokumen/:id/download` | Unduh privat (berotorisasi) |
| GET | `/hasil-seleksi/me` | Hasil seleksi yang telah dipublikasikan |

## Panitia / Admin

| Method | Path | Keterangan |
|---|---|---|
| GET | `/pendaftaran?q=&status=&limit=&offset=` | Antrean + pencarian pendaftar |
| GET | `/pendaftaran/:id` | Detail aplikasi |
| POST | `/pendaftaran/:id/status` | `{status, note?}` transisi status |
| POST | `/verifikasi/dokumen/:id` | `{status, note?}` verifikasi dokumen |
| GET | `/verifikasi/pendaftaran/:id` | Detail + verifikasi |
| GET | `/dashboard/panitia` | Statistik panitia |

## Admin

| Method | Path | Keterangan |
|---|---|---|
| GET | `/dashboard/admin` | Statistik admin |
| GET/POST/PATCH | `/admin/periode`, `/admin/periode/:id` | CRUD periode |
| GET/POST/PATCH | `/admin/jurusan`, `/admin/jurusan/:id` | CRUD jurusan |
| GET/POST/PATCH | `/admin/petugas`, `/admin/petugas/:id` | Kelola akun panitia/admin |
| GET | `/admin/pendaftar?q=` | Pencarian pendaftar (admin) |
| GET | `/admin/audit-log` | Audit log (admin) |
| GET/POST/PATCH/DELETE | `/admin/pengumuman`, `/admin/pengumuman/:id` | Pengumuman |
| POST/PATCH | `/hasil-seleksi`, `/hasil-seleksi/:applicationId` | Simpan hasil |
| POST | `/hasil-seleksi/:applicationId/publish` | Publikasikan hasil |

## Pemetaan error

| Kondisi | HTTP |
|---|---|
| Validasi input gagal (Zod / SQLSTATE 23514/22P02/dll.) | 400 |
| Belum login / sesi kedaluwarsa | 401 |
| Role/ownership tidak diizinkan (42501) | 403 |
| Konflik data unik (23505) | 409 |
| Error internal (tidak membocorkan detail) | 500 |
