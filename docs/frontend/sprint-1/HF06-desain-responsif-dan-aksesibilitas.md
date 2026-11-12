# HF06 — Desain Responsif dan Aksesibilitas

> **Sprint 1 — Perencanaan/desain saja.** Dokumen ini berisi spesifikasi breakpoint, perilaku layout, HTML semantik, dan checklist aksesibilitas, **bukan kode aplikasi**. Belum ada frontend, komponen UI, atau backend HTTP di repo ini. Ground truth berasal dari database PostgreSQL 18 (12 tabel) di `docs/database/INTEGRATION.md`, `docs/database/DATA_DICTIONARY.md`, dan `docs/database/SECURITY.md`.

- **Tiket:** HF06
- **Sprint:** Sprint 1 (perencanaan/desain)
- **Reviewer:** Samuel (BA/UI/UX)
- **Sumber ground truth:** `docs/database/INTEGRATION.md`, `docs/database/DATA_DICTIONARY.md`, `docs/database/SECURITY.md`

## 1. Tujuan

1. Menetapkan breakpoint dan perilaku layout per breakpoint agar semua layar (katalog, registrasi, profil, pilih jurusan, unggah dokumen, pratinjau, antrean panitia, review, admin) dapat dipakai di desktop, tablet, dan mobile.
2. Menetapkan HTML semantik, pelabelan formulir, navigasi keyboard, fokus, dan kontras sebagai syarat yang dapat diuji.
3. Menyediakan checklist aksesibilitas dan checklist pengujian a11y yang konkret untuk Sprint 1.

## 2. Ground truth yang mengikat dokumen ini

| Butir | Fakta |
|---|---|
| Pengguna & peran | Calon siswa (`applicant`), panitia (`committee`), admin — semuanya memakai layar yang sama-sama harus aksesibel; calon siswa kemungkinan besar memakai ponsel |
| Konten | 5 jurusan (TJKT kanonis; TKJT ditolak), 3 dokumen wajib + pendukung, 8 status aplikasi, 7 field profil, hasil seleksi (`accepted` / `waitlisted` / `rejected`; `null` = belum diumumkan) |
| Formulir | Registrasi, profil 7 field, pilih jurusan, unggah dokumen (maks 5 MiB per file; PDF/JPEG/PNG; foto JPEG/PNG saja) |
| Batas | Tidak ada NIK/NISN; jangan tampilkan hash, `storage_key` sebagai tautan publik, atau detail error SQL |

Semua contoh dalam dokumen ini fiktif: nama "Calon Siswa Contoh", email `calon.siswa@example.test`, data dummy/sintetis saja.

## 3. Breakpoint

Breakpoint adalah **usulan** yang harus disahkan Samuel; nilai di bawah ini dipilih karena umum dan mudah diuji, bukan karena ketetapan dari dokumen database.

| Nama | Lebar | Perangkat sasaran |
|---|---|---|
| Mobile | < 640 px | Ponsel (pengguna utama calon siswa) |
| Tablet | 640 – 1023 px | Tablet / ponsel besar / laptop kecil |
| Desktop | ≥ 1024 px | Laptop / monitor panitia & admin |

Aturan umum:

- Layout memakai lebar fluida dengan lebar konten maksimum yang nyaman dibaca (konten teks/formulir tidak melebar tanpa batas di layar sangat lebar).
- Tidak ada konten yang mengharuskan scroll horizontal pada lebar berapa pun; tabel yang lebar diubah tampilannya (lihat §4.3), bukan dibiarkan meluber.
- Ukuran teks dasar minimal 16 px agar tidak memicu zoom otomatis di ponsel; pengguna tetap dapat memperbesar (zoom 200% harus tetap dapat dipakai — lihat §8).
- Target sentuh/klik minimal 44 × 44 px untuk tombol, tautan, dan kontrol formulir di semua breakpoint (khususnya mobile).

## 4. Perilaku layout per breakpoint

### 4.1 Struktur halaman umum

| Elemen | Mobile (< 640 px) | Tablet (640–1023 px) | Desktop (≥ 1024 px) |
|---|---|---|---|
| Header / navigasi | Logo + tombol menu (hamburger) + nama pengguna ringkas | Logo + navigasi utama tampil sebagian + menu | Logo + navigasi utama lengkap + info pengguna + tombol keluar |
| Konten utama | Satu kolom, padding samping secukupnya | Satu kolom, lebar konten lebih besar, padding lebih lega | Satu kolom terpusat dengan lebar maksimum; area kerja panitia/admin dapat memakai dua kolom (daftar + detail) |
| Footer | Menumpuk vertikal | Menumpuk / dua kolom | Satu baris / beberapa kolom |
| Stepper pendaftaran | Langkah aktif + nomor ("Langkah 2 dari 4"), langkah lain ringkas | Semua langkah tampil ringkas | Semua langkah tampil lengkap dengan label |

### 4.2 Formulir (registrasi, profil 7 field, pilih jurusan)

| Elemen | Mobile | Tablet | Desktop |
|---|---|---|---|
| Field formulir | Satu kolom penuh; label di atas field | Satu kolom; field pendek (tanggal lahir, jenis kelamin, telepon) dapat berdampingan dua kolom bila ruang cukup | Satu kolom untuk alur utama; field pendek dapat dua kolom (mis. tempat lahir + tanggal lahir berdampingan) |
| Pilihan jurusan | Kartu-kartu menumpuk vertikal, satu per baris | Kartu dalam grid 2 kolom | Kartu dalam grid 2–3 kolom |
| Tombol aksi | Lebar penuh (primer), sekunder di bawahnya | Primer + sekunder berdampingan, rata kanan | Sama seperti tablet |
| Pesan error | Di bawah field terkait, teks terbaca penuh | Sama | Sama |
| Date picker | Kontrol tanggal native perangkat (mudah dipakai di ponsel) | Sama | Sama |

### 4.3 Tabel (daftar aplikasi, antrean panitia, kelola akun)

| Elemen | Mobile | Tablet | Desktop |
|---|---|---|---|
| Tabel | **Bukan** tabel melebar: tiap baris menjadi kartu (label + nilai per kolom: nomor `BSC-…`, jurusan, status badge, tanggal) | Tabel ringkas; kolom yang kurang penting disembunyikan (mis. tanggal dibuat ringkas) | Tabel lengkap: nomor pendaftaran, periode, jurusan, status, tanggal dibuat |
| Paginasi | Tombol Sebelumnya/Berikutnya lebar penuh | Tombol berdampingan | Sama seperti tablet |
| Filter (periode, status) | Menumpuk vertikal di atas daftar | Berdampingan | Berdampingan |

### 4.4 Unggah dokumen & detail aplikasi

| Elemen | Mobile | Tablet | Desktop |
|---|---|---|---|
| Slot unggah | Satu slot per baris, area seret-dan-letakkan menjadi tombol "Pilih file" besar | Sama, dua slot berdampingan bila ruang cukup | Grid slot (2 kolom) |
| Detail aplikasi | Kartu menumpuk: ringkasan → dokumen → timeline | Sama, dengan jarak lebih lega | Dua kolom: kolom utama (ringkasan + dokumen) dan kolom samping (timeline + hasil) |
| Timeline | Garis vertikal di tepi kiri, entri menumpuk | Sama | Sama |
| Kartu hasil seleksi | Lebar penuh, di atas lipatan detail bila sudah diumumkan; bila `null`, tampilkan "Hasil belum diumumkan." | Sama | Kolom samping |

### 4.5 Modal, toast, dan banner

| Elemen | Mobile | Tablet | Desktop |
|---|---|---|---|
| Modal | Hampir selebar layar, menempel bawah / tengah dengan jarak tepi kecil; tombol aksi menumpuk vertikal | Lebar sedang, di tengah layar | Lebar sedang, di tengah layar |
| Toast | Menempel bawah layar, selebar layar dengan jarak tepi | Menempel bawah-kanan | Menempel bawah-kanan |
| Banner/alert | Lebar penuh di atas konten | Sama | Sama |

## 5. HTML semantik

| Kebutuhan | Spesifikasi |
|---|---|
| Struktur dokumen | Satu `<h1>` per halaman (judul halaman); `<h2>` untuk bagian (Profil, Dokumen, Riwayat); `<h3>` untuk sub-bagian; urutan heading tidak meloncat |
| Landmark | `<header>` (navigasi utama dalam `<nav>` dengan `aria-label`), `<main>` (satu per halaman), `<footer>`; area kerja panitia/admin memakai `<section>` berlabel |
| Navigasi | `<nav>` dengan daftar tautan `<ul>`; halaman aktif ditandai (`aria-current="page"`) |
| Formulir | Setiap formulir memakai `<form>` dengan `<label>` terikat ke kontrolnya; kelompok terkait memakai `<fieldset>` + `<legend>` (mis. kelompok "Jenis kelamin", kelompok "Dokumen wajib") |
| Tabel | Tabel data memakai `<table>` dengan `<caption>` (judul tabel), `<th scope="col">` untuk header kolom dan `<th scope="row">` bila baris memakai header; kartu pengganti tabel di mobile tetap memakai daftar (`<ul>`/`<dl>`) yang bermakna, bukan `<div>` tanpa peran |
| Daftar & timeline | Timeline memakai `<ol>` (berurutan kronologis) dengan tiap entri sebagai `<li>`; daftar aplikasi memakai `<ul>`/tabel sesuai §4.3 |
| Tombol vs tautan | Aksi memakai `<button>`; perpindahan halaman memakai `<a>`; jangan memakai `<div>` yang diklik sebagai tombol/tautan |
| Gambar/ikon | Ikon dekoratif disembunyikan dari pembaca layar (`aria-hidden="true"`); ikon bermakna diberi label teks atau `aria-label`; tidak ada gambar yang menyampaikan informasi hanya lewat visual tanpa teks alternatif |
| Bahasa | Atribut `lang="id"` pada `<html>` (seluruh UI berbahasa Indonesia); bila ada istilah asing yang harus tampil, tandai dengan `lang` yang sesuai |
| Judul halaman | `<title>` unik per halaman dan bermakna, mis. "Biodata — PPDB SMK Bina Sarana Cendekia" (nama resmi proses penerimaan mengikuti keputusan sekolah; jangan inventarisasi nama lain) |

## 6. Label dan formulir

| Kebutuhan | Spesifikasi |
|---|---|
| Label terlihat | Setiap kontrol memiliki `<label>` teks yang terlihat (bukan hanya `placeholder` atau `aria-label` saja) |
| Keterikatan label | `label` terikat lewat `for`/`id` atau membungkus kontrolnya; mengklik label memindahkan fokus ke kontrol |
| Penanda wajib | Teks "(wajib)" pada label field wajib, plus `required` dan `aria-required="true"`; jangan hanya mengandalkan tanda bintang atau warna |
| Petunjuk format | `hint` di bawah label / di atas field: telepon "Contoh: +6281234567890", tanggal lahir "Format: YYYY-MM-DD, antara 1 Januari 1900 dan hari ini", file "PDF, JPEG, atau PNG. Maks 5 MiB."; hubungkan dengan `aria-describedby` |
| Error | Pesan error di bawah field, terhubung dengan `aria-describedby`; field error memakai `aria-invalid="true"`; saat submit gagal, fokus dipindah ke ringkasan error / field error pertama dan ringkasan error memakai `role="alert"` |
| Penghitung karakter | Textarea (`address`, `note`) menampilkan "x / 1000" dan terhubung lewat `aria-describedby` |
| Select | Selalu ada opsi placeholder "Pilih…" yang bukan nilai valid; opsi jurusan memakai nama program dari katalog |
| Date picker | `min="1900-01-01"` dan `max` = hari ini; label menjelaskan rentang |
| File upload | Input file memakai `<label>` yang jelas per jenis dokumen; nama file yang dipilih diumumkan sebagai teks; persyaratan (tipe/ukuran) tertulis di dekat kontrol, bukan hanya di pesan error |
| Autocomplete | Gunakan atribut `autocomplete` yang sesuai bila tersedia (mis. nama, email, telepon) agar pengisian di ponsel lebih mudah |
| Tidak ada CAPTCHA visual saja | Bila backend kelak memakai verifikasi anti-bot, harus ada alternatif yang aksesibel; bukan keputusan Sprint 1 — dicatat sebagai tindak lanjut |

## 7. Keyboard dan fokus

| Kebutuhan | Spesifikasi |
|---|---|
| Semua fungsi lewat keyboard | Semua aksi (navigasi, isi formulir, pilih jurusan, unggah — termasuk tombol "Pilih file", kirim, verifikasi, publish) dapat dilakukan hanya dengan keyboard (Tab / Shift+Tab / Enter / Spasi / panah untuk radio & select) |
| Urutan tab logis | Urutan tab mengikuti urutan visual dan urutan logis formulir (atas ke bawah); tidak ada `tabindex` positif; elemen non-interaktif tidak dapat difokuskan |
| Fokus terlihat | Indikator fokus selalu terlihat di semua kontrol (cincin/garis fokus dengan kontras cukup) di semua breakpoint; fokus tidak pernah dihilangkan demi estetika |
| Lewati navigasi | Tautan "Lewati ke konten utama" (`skip link`) di awal setiap halaman, mengarah ke `<main>` |
| Modal | Fokus terjebak di dalam modal selama terbuka; Escape menutup modal; fokus kembali ke elemen pemicu saat modal ditutup |
| Menu mobile | Tombol menu dapat dioperasikan keyboard; menu terbuka dapat ditutup dengan Escape; fokus dikelola saat menu dibuka/ditutup |
| Toast & perubahan dinamis | Toast memakai `role="status"` (sukses/info) atau `role="alert"` (error penting); perubahan status aplikasi dan hasil seleksi diumumkan lewat live region, bukan hanya perubahan warna |
| Tidak ada jebakan keyboard | Tidak ada komponen yang memerangkap fokus kecuali modal (yang memang disengaja dan dapat ditutup) |
| Pintasan | Tidak ada pintasan keyboard kustom di Sprint 1 (menghindari konflik dengan pembaca layar) |

## 8. Kontras, warna, dan keterbacaan

| Kebutuhan | Spesifikasi |
|---|---|
| Kontras teks | Teks isi minimal rasio kontras 4.5:1 terhadap latar; teks besar (judul) minimal 3:1 — mengikuti WCAG 2.1 AA sebagai target (target ini adalah usulan standar, bukan klaim bahwa pengujian sudah dilakukan) |
| Kontras komponen | Batas kontrol formulir, indikator fokus, dan ikon bermakna minimal 3:1 terhadap latar sekitarnya |
| Warna bukan satu-satunya penanda | Status (badge), error, dan sukses selalu disertai teks label/ikon bermakna; error tidak hanya garis merah; sukses tidak hanya centang hijau |
| Ukuran teks | Teks isi minimal 16 px; pengguna dapat memperbesar tampilan hingga 200% tanpa kehilangan konten atau fungsi (tidak ada teks yang terpotong/tertutup) |
| Spasi baris & paragraf | Jarak baris cukup untuk keterbacaan (target sekitar 1.5 untuk teks isi); teks tidak rapat hingga sulit dibaca |
| Gerakan | Hormati preferensi pengurangan gerakan (`prefers-reduced-motion`): animasi/transisi diminimalkan bila pengguna memintanya |
| Mode gelap | Bukan cakupan Sprint 1; bila ditambahkan kelak, seluruh aturan kontras di atas berlaku kembali |

## 9. Checklist aksesibilitas (desain)

- [ ] Setiap halaman punya satu `<h1>` dan urutan heading yang benar.
- [ ] Landmark `<header>` / `<nav>` / `<main>` / `<footer>` dipakai di semua halaman.
- [ ] Semua kontrol formulir punya label terlihat yang terikat benar.
- [ ] Field wajib ditandai teks "(wajib)" + `required` + `aria-required`.
- [ ] Petunjuk format (telepon, tanggal, file) tertulis dan terhubung via `aria-describedby`.
- [ ] Pesan error terhubung ke field (`aria-describedby` + `aria-invalid`) dan ringkasan error memakai `role="alert"`.
- [ ] Badge status selalu menyertakan teks label, bukan hanya warna.
- [ ] Semua aksi dapat dilakukan dengan keyboard; urutan tab logis; tidak ada `tabindex` positif.
- [ ] Indikator fokus terlihat di semua kontrol.
- [ ] Skip link "Lewati ke konten utama" tersedia di setiap halaman.
- [ ] Modal menjebak fokus, dapat ditutup dengan Escape, dan mengembalikan fokus ke pemicu.
- [ ] Toast memakai `role="status"` / `role="alert"` sesuai jenisnya.
- [ ] Kontras teks ≥ 4.5:1 dan komponen ≥ 3:1 (target WCAG 2.1 AA).
- [ ] Teks dapat diperbesar 200% tanpa kehilangan konten/fungsi.
- [ ] `prefers-reduced-motion` dihormati.
- [ ] `lang="id"` pada `<html>`; judul halaman (`<title>`) unik dan bermakna.
- [ ] Tabel memakai `<caption>` + `<th scope>`; versi kartu di mobile memakai daftar bermakna.
- [ ] Tidak ada konten yang mengharuskan scroll horizontal di breakpoint mana pun.
- [ ] Target sentuh/klik minimal 44 × 44 px.
- [ ] Hasil seleksi `null` ditampilkan sebagai "Hasil belum diumumkan." (teks), bukan lewat warna atau ikon saja.

## 10. Checklist pengujian a11y (untuk dilaksanakan saat implementasi — bukan klaim sudah diuji)

Pengujian berikut **belum dilakukan** di Sprint 1 (belum ada kode untuk diuji); daftar ini adalah rencana pengujian yang harus dijalankan setelah implementasi.

### 10.1 Pengujian keyboard (manual)

- [ ] Jelajahi setiap halaman hanya dengan keyboard (Tab / Shift+Tab / Enter / Spasi / Escape / panah): semua aksi tercapai, tidak ada jebakan fokus.
- [ ] Periksa urutan tab mengikuti urutan visual di formulir registrasi, profil, pilih jurusan, unggah dokumen, dan review panitia.
- [ ] Buka dan tutup setiap modal dengan keyboard; pastikan fokus kembali ke pemicu.
- [ ] Uji skip link: dari awal halaman, Tab pertama mencapai "Lewati ke konten utama" dan Enter melompat ke `<main>`.

### 10.2 Pengujian pembaca layar (manual)

- [ ] Uji dengan minimal satu pembaca layar (mis. NVDA / VoiceOver — pilihan alat disahkan tim saat implementasi): judul halaman, heading, label formulir, pesan error, dan badge status terbaca dengan benar.
- [ ] Pastikan ikon dekoratif tidak dibacakan dan ikon bermakna memiliki label.
- [ ] Pastikan toast dan perubahan status diumumkan (live region), bukan diam.
- [ ] Pastikan tabel dibacakan dengan header kolom yang benar, dan versi kartu di mobile terbaca sebagai daftar yang bermakna.

### 10.3 Pengujian otomatis & visual

- [ ] Jalankan pemeriksa aksesibilitas otomatis (mis. axe — pilihan alat disahkan tim saat implementasi) pada setiap halaman dan tindak lanjuti temuan kritis/serius.
- [ ] Periksa kontras dengan alat pengukur kontras pada teks dan komponen di semua breakpoint.
- [ ] Periksa zoom 200% di desktop dan pembesaran teks di mobile: tidak ada konten hilang/tertutup dan tidak ada scroll horizontal.
- [ ] Periksa `prefers-reduced-motion`: animasi berkurang saat preferensi aktif.

### 10.4 Pengujian responsif (manual)

- [ ] Uji tiap halaman pada tiga breakpoint §3 (mobile < 640 px, tablet 640–1023 px, desktop ≥ 1024 px): layout sesuai §4, tidak ada scroll horizontal, target sentuh ≥ 44 × 44 px.
- [ ] Uji formulir unggah dokumen di ponsel: tombol "Pilih file" mudah dijangkau; persyaratan tipe/ukuran terbaca sebelum memilih file.
- [ ] Uji tabel antrean panitia di mobile: tampil sebagai kartu yang lengkap dan terbaca.
- [ ] Uji modal dan toast di mobile: tidak menutupi tombol aksi utama dan dapat ditutup.

### 10.5 Pengujian konten & status

- [ ] Pastikan label status (8 status aplikasi, status verifikasi, hasil seleksi) tampil sebagai teks di semua breakpoint.
- [ ] Pastikan `selection_result: null` tampil sebagai "Hasil belum diumumkan." — bukan "Tidak diterima" atau kesimpulan lain.
- [ ] Pastikan tidak ada hash, `storage_key`, atau detail error SQL yang tampil di layar mana pun.

## 11. Daftar periksa sebelum implementasi (untuk Samuel)

- [ ] Sahkan breakpoint §3 (640 / 1024 px) dan perilaku layout §4.
- [ ] Sahkan target kontras WCAG 2.1 AA (§8) sebagai standar proyek.
- [ ] Sahkan struktur heading dan landmark §5.
- [ ] Sahkan checklist pengujian §10 dan pilihan alat (pembaca layar, pemeriksa otomatis) saat implementasi.
- [ ] Sahkan bahwa mode gelap bukan cakupan Sprint 1.

## Status review

**Review PENDING — persetujuan BELUM diperoleh.** Dokumen ini menunggu review oleh **Samuel** (BA/UI/UX). Tidak ada persetujuan atas breakpoint, perilaku layout, aturan semantik, maupun checklist aksesibilitas di atas yang diklaim telah diberikan oleh Samuel, Fadlan, Rizki, atau siapa pun.
