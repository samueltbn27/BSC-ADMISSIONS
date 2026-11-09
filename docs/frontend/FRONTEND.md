# Panduan Frontend

Stack: React 18 + TypeScript + Vite 6 + Tailwind CSS 3 + React Router 6 + TanStack Query 5 +
React Hook Form + Zod + Lucide + Sonner.

## Menjalankan

```sh
cd frontend
npm install
npm run dev
```

Akses `http://localhost:5173`. Vite mem-proxy `/api` ke `http://localhost:4000`
(lihat `vite.config.ts`), sehingga cookie sesi mengalir tanpa konfigurasi CORS.

Build produksi:

```sh
npm run build        # tsc + vite build -> dist/
npm run preview
```

## Struktur

```text
src/
├── components/
│   ├── ui/            # Button, Input, Card, Badge, dll.
│   ├── layouts/       # PublicLayout, DashboardLayout
│   └── shared/        # states, pagination, confirm dialog, badge status, staff list/detail
├── pages/
│   ├── public/        # Beranda, profil sekolah, jurusan, alur, jadwal, syarat, FAQ, pengumuman
│   ├── auth/          # Login, Register
│   ├── siswa/         # Dashboard, biodata, pendaftaran, dokumen, status, hasil, profil
│   ├── panitia/       # Dashboard, pendaftaran, detail, verifikasi, laporan
│   └── admin/         # Dashboard, CRUD jurusan/periode/petugas/pengumuman, hasil, audit
├── routes/            # Guardian role (ProtectedRoute, RoleRoute, GuestRoute)
├── hooks/useAuth.ts   # Sesi + login/register/logout
├── lib/api.ts         # Fetch wrapper (credentials include, error normalization)
├── types/             # Tipe domain
```

## Catatan integrasi

- Semua data diambil dari backend — tidak ada angka dummy.
- Status workflow: `draft → submitted → under_review → correction_requested/verified →
  selection_in_progress → completed` (dan `withdrawn`).
- Dokumen diganti dengan mengunggah ulang (revisi), bukan dihapus — sesuai desain database.
- Halaman publik (profil sekolah, FAQ, alur) memakai konten placeholder yang ditandai dan
  dapat diperbarui di kode hingga modul konten admin tersedia.
