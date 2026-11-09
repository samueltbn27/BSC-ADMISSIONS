# Laporan Pengujian — Full-Stack MVP

Tanggal: 9 November 2026. Lingkungan: Windows 11, Node 24.15, PostgreSQL 18.6 (lokal).

## Backend (Vitest + Supertest)

`cd backend && npm test` — **25 tes lulus** (4 file):

| File | Cakupan |
|---|---|
| `argon2id.test.ts` | Hash PHC memenuhi constraint DB, roundtrip, salt acak, tolak non-PHC |
| `session.test.ts` | Sesi: buat/baca/hapus/kedaluwarsa |
| `auth.test.ts` | Register (normalisasi email, cookie), konflik email, password pendek, login sukses/salah/tidak dikenal/suspended, me tanpa sesi, logout |
| `security.test.ts` | CSRF origin asing, RBAC (admin/panitia menolak siswa), validasi input, redaksi SQLSTATE |

Pengujian di atas memakai mock lapisan DB sehingga berjalan tanpa database live.
Tes integrasi database nyata tersedia via `RUN_DB_TESTS=1 npm test`
(registrasi → login → profil → konflik email) dan **tidak mengklaim lulus**
sebelum dijalankan terhadap database tersedia.

## Database (existing, dari PR #1)

- `make check` dan `make test` (76 assertion SQL + 3 unit test) — lihat
  [TEST_RESULTS.md](../database/TEST_RESULTS.md). Hasil tersebut dari pekerjaan database sebelumnya;
  pengujian ulang pada mesin ini tertunda karena **Smart App Control Windows** memblokir
  `plpgsql.dll` unsigned PostgreSQL (kebijakan OS, bukan kode). Setelah SAC dimatikan,
  migration 001-003 dapat diterapkan kembali pada cluster baru.

## Build

- Backend: `npm run build` (tsc) berhasil.
- Frontend: `npm run build` (tsc + vite build) berhasil.
  Catatan: pada mesin dengan Smart App Control, rollup native diganti
  `@rollup/wasm-node` (lihat package.json) agar bundling tidak diblokir kebijakan OS.

## E2E manual (direkomendasikan)

1. Seed + migrate DB, aktifkan satu periode (opsi admin/DBA).
2. `cd backend && npm run dev`; `cd frontend && npm run dev`.
3. Alur calon siswa: registrasi → biodata → buat pendaftaran → unggah dokumen → submit.
4. Promosikan admin (DBA) lalu buat panitia via `/admin/petugas`.
5. Panitia: verifikasi dokumen, transisi status.
6. Admin: tetapkan & publikasikan hasil; siswa melihat hasil di `/siswa/hasil`.
