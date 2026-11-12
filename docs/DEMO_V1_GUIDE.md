# Panduan Demo V1 — BSC Admissions

Prototype akademik; gunakan data siswa dan dokumen sintetis. Implementasi/integrasi Demo V1 ini dilakukan **12 November 2026**, sesudah Sprint 1 tanggal 2–8 November. Jangan menggunakan video ini sebagai bukti penyelesaian implementasi pada Sprint 1. Dokumentasi Sprint 1 yang diwarisi tetap dipertahankan sebagai dokumen perencanaan.

## Menjalankan pada checkout lokal ini

Prasyarat: Node.js 24 (minimal 22.12), npm, Python 3.9+, PostgreSQL 18 server dan client (`initdb`, `postgres`, `pg_ctl`, `psql`). Script tidak memakai Docker/layanan berbayar.

```sh
cd BSC-ADMISSIONS
npm --prefix backend ci
npm --prefix frontend ci
python3 scripts/demo.py setup
npm --prefix backend run build
npm --prefix frontend run build
python3 scripts/demo.py start
```

Buka **http://localhost:4000**. Frontend dan API disajikan satu origin oleh Express. PostgreSQL demo memakai loopback port 55441; server web memakai loopback port 4000. Tidak ada koneksi PostgreSQL dari browser.

Di macOS bila PostgreSQL server belum terpasang: `brew install postgresql@18`. Script mendeteksi `/opt/homebrew/opt/postgresql@18/bin`; pada sistem lain letakkan bin PostgreSQL 18 di PATH atau set `PG_BINDIR=/path/to/postgresql/18/bin`.

## Akun dan file dummy

Setup membuat `.local/demo/accounts.json` berizin 0600, berisi email/password acak untuk:

| Email | Role | Penggunaan |
|---|---|---|
| siswa.demo@example.test | Calon siswa | Profil sintetis siap diedit; belum ada aplikasi |
| panitia.demo@example.test | Panitia | Memeriksa aplikasi/dokumen |
| admin.demo@example.test | Admin | Ringkasan, jurusan, periode |
| contoh-1.demo@example.test | Calon siswa | Contoh status submitted |
| contoh-2.demo@example.test | Calon siswa | Contoh correction_requested |
| contoh-3.demo@example.test | Calon siswa | Contoh under_review |

Buka file akun hanya di komputer lokal. Jangan tampilkan file tersebut saat screen recording atau commit. Script tidak mencetak password. Password berubah setiap reset. Registrasi publik hanya membuat calon siswa; registrasi tidak membuat sesi. Masuk melalui `/login` sesudah akun dibuat.

File dummy tersedia di `.local/demo/fixtures/`:

- `dokumen-dummy.pdf`: PDF berlabel dokumen sintetis, untuk KK dan ijazah/SKL.
- `foto-dummy.png`: gambar pola geometris sintetis, untuk pas foto; tidak memakai wajah siswa.

Jenis wajib mengikuti seed Husni: **Ijazah atau SKL, Kartu Keluarga, Pas foto**. Dokumen pendukung opsional. Akta tidak ditambahkan karena bukan jenis yang diwajibkan seed aktual. PDF/JPG/PNG mengikuti allowlist per jenis; pas foto hanya JPG/PNG; batas seed 5 MiB.

## Urutan klik dan hasil yang diharapkan

| Adegan | Halaman/tindakan | Hasil yang diharapkan |
|---|---|---|
| 1 | `/` — tampilkan hero, jurusan, persyaratan | Banner prototype akademik dan katalog PostgreSQL |
| 2 | Klik **Daftar Sekarang** | Form registrasi `/register` |
| 3 | Gunakan email baru `rekaman-01@example.test`, password lokal pilihan sendiri, konfirmasi | Pesan akun dibuat, diarahkan ke login |
| 4 | Login dengan akun baru | Dashboard calon siswa |
| 5 | **Lengkapi Formulir** atau menu **Biodata** | Isi nama sintetis, kota contoh, tanggal 2010-05-01, L/P, alamat sintetis, telepon +6280000000000; klik **Simpan Draft Biodata** |
| 6 | Menu **Pendaftaran** → **Pendaftaran Baru** → pilih periode DEMO dan jurusan → **Buat Draft** | Satu draft tersimpan; pilihan jurusan dapat diubah |
| 7 | **Kelola Dokumen** → unggah PDF ke KK dan ijazah/SKL, PNG ke pas foto | Setiap jenis menampilkan ukuran, revisi dan status pending |
| 8 | **Kembali ke Pendaftaran** → **Kirim Pendaftaran** → **Lihat Status & Riwayat** | Status Terkirim/submitted dan riwayat pengiriman |
| 9 | **Keluar** → **Ya, keluar** → Login panitia | Dashboard panitia |
| 10 | Menu **Pendaftaran** → cari nama sintetis → **Detail** | Biodata, dokumen privat, riwayat |
| 11 | **Mulai Periksa** → konfirmasi; unduh berkas jika perlu; klik **Setujui** pada setiap berkas; lalu **Setujui & Verifikasi** → konfirmasi | Status verified; semua dokumen harus disetujui lebih dulu |
| 12 | Logout panitia → login siswa → **Status** | Status Terverifikasi dan riwayat terbaru; refresh jika perlu |

Alternatif koreksi: saat under_review, isi catatan **Catatan perbaikan**, gunakan **Minta Perbaikan** untuk aplikasi lalu konfirmasi. Siswa melihat catatan, mengganti dokumen dan mengirim ulang. Panitia memulai pemeriksaan kembali dan menyetujui revisi terbaru. Tombol koreksi per dokumen juga menggunakan catatan yang diisi. Jangan menyamakan verifikasi berkas dengan diterima sebagai murid: keputusan seleksi di luar demonstrasi inti V1.

## Cuplikan 60–120 detik

- 0–10 dtk: landing page dan label demo akademik.
- 10–25 dtk: registrasi/login (potong waktu mengetik, jangan perlihatkan password).
- 25–45 dtk: biodata → jurusan → draft.
- 45–65 dtk: unggah tiga file dummy → kirim → status Terkirim.
- 65–100 dtk: login panitia → detail → mulai periksa → setujui dokumen → verifikasi.
- 100–120 dtk: kembali sebagai siswa → status Terverifikasi dan riwayat.

Narasi: “Demo V1 ini mengintegrasikan database dan aplikasi untuk memperagakan alur PPDB. Implementasi setelah Sprint 1, dengan data sintetis, belum deployment produksi.” Sesuaikan durasi dengan pemotongan transisi login, bukan memalsukan status layar.

## Mengulang demo

1. Hentikan web dengan Ctrl+C pada terminal server. Tutup tab atau logout semua akun.
2. Dari root BSC-ADMISSIONS: `python3 scripts/demo.py reset`.
3. Reset hanya membuang database **bsc_demo_v1** milik **bsc_demo_owner** pada cluster privat yang ditandai `.local/demo/demo.json`, lalu membuat ulang migration, seed, akun, periode dan file. Tidak menghapus database tim.
4. Buka password terbaru pada `.local/demo/accounts.json`.
5. Jalankan `python3 scripts/demo.py start`; refresh browser. Sesi lama tidak berlaku karena proses backend sudah berhenti.

`setup` berikutnya tidak mereset data. Untuk menghentikan PostgreSQL setelah web dihentikan: `python3 scripts/demo.py stop`. Periode dibuat mulai kemarin hingga 30 hari setelah setup/reset, bukan jadwal resmi sekolah.

## Troubleshooting

- **Port 4000 terpakai**: hentikan proses pemilik port tersebut. Setup/reset menolak berjalan bila ada server di port 4000 agar tidak menyisakan sesi lama. Jangan mematikan aplikasi orang lain tanpa mengetahui pemiliknya.
- **Port 55441 terpakai**: hentikan cluster demo sebelumnya menggunakan perintah stop. Jangan menggunakan cluster database lain sebagai pengganti.
- **`postgres` tidak ditemukan di direktori initdb**: gunakan paket PostgreSQL server lengkap, bukan client libpq saja; set `PG_BINDIR` ke direktori server.
- **Nama path Unix socket terlalu panjang**: script memakai socket privat pendek `/tmp/bsc-demo-<uid>` dengan izin 0700.
- **Setup terputus di tengah**: hentikan web, lalu gunakan `reset` pada folder dengan marker yang valid. Script menolak menimpa `.env`/cluster existing tanpa marker.
- **Tidak bisa login setelah reset**: password berubah; baca file akun terbaru. Akun hasil registrasi video sebelumnya ikut dihapus.
- **Login dibatasi**: tunggu 60 detik; default 10 percobaan autentikasi per IP per menit. Jangan menampilkan password di log/video.
- **CSRF ditolak**: gunakan persis `http://localhost:4000`, bukan `127.0.0.1:4000`; origin konfigurasi harus cocok.
- **Upload ditolak**: gunakan PDF/PNG dummy dari fixtures; nama ekstensi, MIME, isi dan ukuran harus cocok. Foto tidak menerima PDF. File rusak/berukuran >5 MiB ditolak.
- **Kirim ditolak**: isi semua enam field biodata dan tiga jenis dokumen wajib. Simpan biodata sebelum membuat aplikasi.
- **Verifikasi ditolak**: status harus under_review, dan seluruh dokumen yang diunggah harus approved (termasuk dokumen opsional bila diunggah).
- **Pendaftaran duplikat**: satu profil hanya boleh satu aplikasi per periode, termasuk aplikasi yang ditarik; gunakan aplikasi existing atau reset demo.
- **Frontend belum dibuild**: jalankan `npm --prefix frontend run build`.
- **Storage tidak ditemukan setelah update**: UPLOAD_DIR dihitung relatif ke working directory backend, atau gunakan path absolut seperti setup otomatis.

## Batas dan validasi

Sesuai instruksi pengguna terbaru, pengujian tambahan dihentikan. Status pengujian yang sempat dilakukan ada pada [laporan](demo/IMPLEMENTATION_REPORT.md). Build dan startup bukan bukti bahwa seluruh acceptance criteria sudah lulus.

Aplikasi lokal satu proses; sesi di memori dan hilang saat restart. Tidak ada antivirus/CDR, kuota disk per akun, backup/restore teruji, TLS deployment, pengujian penetrasi, UAT/browser end-to-end final, atau deployment produksi. File diparse untuk validitas format tetapi tidak dijamin bebas malware. Tidak ada pembayaran, email/OTP, OCR, AI, Dapodik atau seleksi otomatis.
