# Demo V1 — Laporan implementasi 12 November 2026

## Audit dan integrasi

Folder awal `/Users/hoesnicodes/Documents/ChatGPT/hoescodes studio` adalah repository **hoesnial/REVO-LAB**, branch main, commit `72433cf`, dengan Next.js. Tidak ada kode proyek itu yang diubah. BSC Admissions di-clone ke subfolder `BSC-ADMISSIONS` sebagai repository Git terpisah.

Remote BSC-ADMISSIONS saat audit:

- `main`: `233df9b0a46b9a1e3aa7de435a5866dfcc44bfbc`.
- `feature/database-husni`: `9b1e2bd8e1aba51ec7f46df3af981b222147c1c4`.
- `PM-backend-fadlan`: `6a315f1cbe4342dee25a3f7a12dac1e91493df1f`.
- `frontend-dev-hafizd`: `4b514fedfc49c39aedad006a4974e7ed7013c135`.

[PR #1](https://github.com/samueltbn27/BSC-ADMISSIONS/pull/1) berstatus **Merged**, 6 November 2026, merge `233df9b`. Tidak menganggap branch backend/frontend sudah merged ke remote main: kedua branch itu diintegrasikan hanya pada branch lokal `feature/demo-v1-uts`. Backend masuk fast-forward; dokumentasi frontend masuk melalui merge lokal `b2a9245` tanpa konflik. Tidak ada force push/push/merge Demo V1 ke main.

Audit mencakup daftar file seluruh branch, log Git, README, API/kontrak integrasi, schema/migration, bootstrap privilege, seed, dictionary, route backend, session/auth, file upload, halaman frontend dan suite tes existing. Database aktual memakai `users.role_code` → `roles.code`; tidak ada role_id, NIK/NISN atau sekolah asal. Form mengikuti schema aktual tanpa kolom duplikat.

Rencana yang diterapkan: integrasi stack existing → cluster dan bootstrap demo → perbaikan auth/upload/UI → build → dokumentasi dan menjalankan server. Next.js di workspace induk tidak digunakan untuk BSC Admissions.

## Hasil implementasi

- React/Vite/Tailwind + Express/TypeScript + PostgreSQL 18 dari branch existing dipertahankan.
- Migration 001/002 Husni dan semua constraint inti tetap utuh. Migration 003 existing backend diterapkan: helper profil/dokumen/admin, pengumuman (13 tabel bisnis total; 12 tabel inti tetap ada).
- Landing page biru/putih, branding sederhana, jurusan dan persyaratan dari database, banner prototype; menghapus alamat/kontak/visi/misi sekolah yang tidak didukung sumber.
- Registrasi → login terpisah, dashboard siswa, draft biodata, draft aplikasi/pilihan jurusan, unggah file nyata, kirim, review/koreksi/verifikasi panitia, histori dan status siswa memakai fungsi SQL existing.
- Referensi input file dipisahkan per jenis; menu dokumen/status mengambil aplikasi terbaru jika URL tidak memuat ID; UI unggah menampilkan kebijakan format/ukuran.
- Panitia melihat nama jenis berkas dari katalog; dashboard siswa menampilkan nama dan petunjuk langkah berikutnya.
- Dashboard admin/jurusan/periode existing dipertahankan. Fitur administratif tambahan dari branch backend tidak diklaim sudah menjalani UAT final.
- Bootstrap/reset development menghasilkan 6 akun dengan password acak unik, 1 periode contoh dinamis, 3 aplikasi contoh dan PDF/PNG sintetis yang benar-benar ada pada disk.
- Cluster demo terpisah, pemilik migration non-superuser, dua login backend terpisah dengan capability paling kecil, koneksi TCP SCRAM loopback, file rahasia 0600, socket administratif lokal privat 0700.

## Tiga aspek keamanan

**K1.** Hash Argon2id PHC m=65536 KiB, t=3, p=1, salt acak. Sesi server acak 256 bit hanya setelah login; cookie HttpOnly/SameSite=Lax. Logout menghapus sesi. Request terlindungi memeriksa ulang status/role/password_changed_at; pergantian password mengakhiri sesi. Rate limit autentikasi default 10/menit/IP. HTTP lokal memakai COOKIE_SECURE=false, deployment HTTPS perlu true.

**K2.** Middleware backend mewajibkan sesi dan role. SQL SECURITY DEFINER dengan fixed search_path kembali memeriksa role dan ownership. Identitas aktor selalu dari sesi backend. Runtime tidak memakai DBA/migrator dan tidak mendapat akses tabel langsung. URL download bukan static/public; get_document memeriksa kewenangan.

**K3.** Zod memvalidasi server, batas body 100 KiB, filter/paginasi dibatasi, tanggal lahir harus valid dan tidak di masa depan, query memakai bind parameters. React meng-escape teks. Error client tidak mengandung SQLSTATE/stack; log internal tidak menulis body, cookies atau query string. Header Helmet dan origin check diterapkan.

Upload: batas multipart/file, ekstensi+MIME+signature harus cocok; parser PDF/PNG/JPEG menolak konten rusak, gambar dibatasi 12 megapiksel, PDF 1–100 halaman dan tidak terenkripsi. Ownership/status diperiksa sebelum decoding/writing dan diperiksa lagi oleh fungsi SQL saat metadata disimpan. Key acak, mkdir 0700/file 0600, cleanup bila metadata gagal. Parser format **bukan antivirus/CDR** dan tidak menjamin bebas malware. Crash di antara filesystem dan transaksi SQL dapat meninggalkan orphan; reset membersihkan storage demo.

## Keputusan UI

Skill Refero Design dibaca. Tiga pencarian style ditolak layanan karena **NO_SUBSCRIPTION**; tidak mengklaim ada referensi live yang telah ditinjau. Fallback memakai desain existing branch Fadlan, brief pengguna, dan referensi craft lokal (forms, focus, touch, navigation/accessibility).

| Keputusan | Sumber dan fungsi |
|---|---|
| Navy/biru/putih; primary-950/900, blue-50, slate | Brief pengguna + token Tailwind existing; navy untuk hero/navigasi, biru untuk tindakan, hijau hanya status |
| Hero terbelah dan daftar empat langkah bernomor | Alur PPDB brief; diagram langkah membantu memahami proses tanpa membuat bukti status palsu |
| Label/autocomplete/format telepon dan file per jenis | Craft Details; mengurangi kesalahan formulir |
| Banner demo serta jadwal/jurusan database | Konteks akademik dan sumber data aktual |
| Sistem font lokal dan icon lucide existing | Kebutuhan offline, tanpa asset/CDN eksternal |
| Menu mobile menutup saat navigasi; focus-visible | Craft Details navigation dan keyboard |

Target desain: UI existing yang disempurnakan, mengikuti warna dan pola komponen existing. Visual/browser QA final tidak dijalankan sesuai instruksi pengguna terbaru.

## Pengujian yang benar-benar sempat dijalankan

Pengguna kemudian menginstruksikan **implementasi saja, jangan melakukan pengujian, lalu jalankan web**. Tidak ada pengujian tambahan setelah instruksi tersebut.

Sebelum instruksi itu:

- Backend `npm test`: **25 passed, 2 skipped**, 4 test files passed, 1 skipped. Dua tes integrasi DB opt-in tidak diaktifkan. Hasil terakhir saat itu menggunakan Vitest 4.1.12. Kode terus diperbarui setelah hasil ini, sehingga bukan sertifikasi keadaan final.
- Tes database scratch: migration paralel, seed berulang dan bootstrap mencapai tahap assertion SQL; suite **gagal** pada assertion lama “twelve core tables remain intact” karena migration 003 menambah school_announcements. Assertion disesuaikan untuk menghitung 12 tabel inti dengan mengecualikan tabel tambahan. Runner rollback juga disesuaikan dengan jumlah migration dinamis dan prasyarat capability migration 003. **Tidak dijalankan ulang** setelah perbaikan.
- Percobaan awal `npm ci` frontend gagal: override Rollup bertentangan dengan dependency langsung. Override lama dihapus, package/lock diperbarui dan install berhasil. `npm ci` baru belum diulang setelah perubahan lock.
- Build frontend sempat gagal karena referensi tipe pada MIME dan perubahan generic resolver Zod; diperbaiki. Build frontend/backend kemudian berhasil.
- Bootstrap awal sempat gagal karena binary initdb menunjuk client libpq, lalu karena pemetaan role_id yang salah pada script baru. Pemilihan binary server diperbaiki dan field dipetakan ke role_code; setup/reset sesudahnya berhasil membuat data demo.
- Install/audit setelah update dependency melaporkan **0 vulnerabilities** untuk backend dan frontend. Ini hanya hasil registry audit saat itu, bukan bukti keamanan seluruh aplikasi.

Sesudah instruksi untuk tidak menguji: hanya build yang dibutuhkan untuk menjalankan aplikasi dan startup, bukan suite test, curl smoke test, atau UAT browser. Build frontend memberi warning ukuran bundle >500 kB dan annotation komentar Zod; tidak memblokir build.

Belum diverifikasi lewat pengujian akhir: alur browser lengkap, validasi unggah baru lewat HTTP nyata, ownership lewat HTTP+DB final, penolakan duplikat HTTP, rate-limit final, responsive visual final, dan seluruh acceptance criteria. Tidak mengklaim semua acceptance criteria lulus.

## Git dan file perubahan

Kontribusi yang diintegrasikan tetap memiliki riwayat Git asli. Perubahan Demo V1 mencakup:

- `backend/src`: konfigurasi bind/HTTP, pemeriksaan sesi, registrasi, validasi, upload parser/private storage dan safe error.
- `backend/scripts/seed-demo.ts`, `scripts/demo.py`: setup/reset dan data sintetis.
- `frontend/src`: landing/profil sekolah, layout, auth, biodata/dokumen/dashboard/status dan petunjuk pendaftaran.
- `backend/package*.json`, `frontend/package*.json`: lock reproducible dan pembaruan dependency.
- Tes existing disesuaikan dengan registrasi tanpa sesi dan schema tambahan; tidak diklaim seluruh penyesuaian sudah dites ulang.
- README, env example, panduan rekaman, laporan ini, serta catatan keamanan/API diperbarui.

Daftar tepat: `git show --stat` untuk commit Demo V1 atau `git diff main --stat` untuk seluruh integrasi. `.env`, akun, data PostgreSQL, fixture hasil generate, uploads, node_modules, dan dist diabaikan Git.

## Di luar cakupan / belum produksi

Tidak ada payment, OTP/email, OCR, AI, Dapodik, seleksi otomatis atau deployment cloud. Sesi satu proses di memori, belum session store terdistribusi. Tidak ada malware scanner, CDR, kuota/retensi disk, backup/restore teruji, pengujian beban atau pentest/TLS produksi. Ringkasan dashboard existing dibatasi 100 profil pertama dan membutuhkan agregasi sebelum skala produksi. Konfirmasi BA mengenai identitas/persyaratan sekolah tetap diperlukan. Dokumen Sprint 1 tidak dianggap bukti implementasi selesai sebelum tanggal pekerjaan aktual.
