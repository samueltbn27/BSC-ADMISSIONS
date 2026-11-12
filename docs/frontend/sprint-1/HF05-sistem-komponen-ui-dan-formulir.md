# HF05 — Sistem Komponen UI dan Formulir

> **Sprint 1 — Perencanaan/desain saja.** Dokumen ini berisi inventaris komponen dan spesifikasi formulir sebagai tabel wireframe deskriptif, **bukan kode aplikasi**. Belum ada frontend, komponen UI, atau backend HTTP di repo ini. Ground truth berasal dari database PostgreSQL 18 (12 tabel) di `docs/database/INTEGRATION.md`, `docs/database/DATA_DICTIONARY.md`, dan `docs/database/SECURITY.md`.

- **Tiket:** HF05
- **Sprint:** Sprint 1 (perencanaan/desain)
- **Reviewer:** Samuel (BA/UI/UX)
- **Sumber ground truth:** `docs/database/INTEGRATION.md`, `docs/database/DATA_DICTIONARY.md`, `docs/database/SECURITY.md`

## 1. Tujuan

1. Menetapkan inventaris komponen reusable beserta props, state, dan pesan feedback masing-masing, agar semua layar Sprint 1 konsisten.
2. Menspesifikasikan formulir registrasi, profil (7 field), pilih jurusan, dan unggah dokumen sebagai tabel wireframe deskriptif — urutan field, label, placeholder, validasi tampilan, dan pesan error — tanpa menulis kode.
3. Mengikat setiap validasi tampilan ke batas yang ada di `DATA_DICTIONARY.md` (panjang, pola, MIME, ukuran file, nilai enum).

## 2. Ground truth yang mengikat dokumen ini

| Butir | Fakta |
|---|---|
| Jurusan | 5 program: TJKT (kanonis; `TKJT` ditolak), PPLG, ANIMASI, MPLB, OTOMOTIF. Nama program ditampilkan dari katalog (`get_catalog`), bukan di-hardcode |
| Dokumen wajib | 3 jenis: `graduation_proof` (ijazah ATAU SKL, satu slot), `family_card`, `photo`; plus dokumen pendukung opsional sesuai katalog. Maks **5 MiB per jenis**; PDF/JPEG/PNG; `photo` hanya JPEG/PNG |
| Status aplikasi | 8 nilai: `draft`, `submitted`, `under_review`, `correction_requested`, `verified`, `selection_in_progress`, `completed`, `withdrawn` |
| Profil | 7 field: `full_name` 1–150, `birthplace` 1–100, `birth_date` ≥ 1900-01-01 dan ≤ hari ini, `gender` L/P, `address` 1–1000, `phone` E.164 (`+` + 8–15 digit, digit pertama bukan nol), email maks 254. Tidak ada NIK/NISN |
| Nomor pendaftaran | `BSC-` + UUID tanpa tanda hubung, huruf besar |
| Submit | Memerlukan 7 field biodata lengkap + 3 dokumen wajib; snapshot profil dibuat server |
| Keamanan tampilan | Jangan tampilkan hash, `storage_key` sebagai tautan publik, atau detail error SQL; kontrol UI berdasarkan role bukan pengaman utama; aktor berasal dari sesi server |
| Hasil seleksi | `selection_result: null` berarti hasil belum tersedia — jangan disimpulkan gagal |

Semua contoh dalam dokumen ini fiktif: nama "Calon Siswa Contoh", email `calon.siswa@example.test`, telepon `+6281234567890`, data dummy/sintetis saja.

## 3. Prinsip sistem komponen

1. **Satu komponen, satu tugas.** Setiap komponen di §4 dipakai ulang di semua layar; tidak ada komponen sekali pakai yang menduplikasi perilaku komponen lain.
2. **State eksplisit.** Setiap komponen menyatakan state-nya (default, hover, fokus, aktif, nonaktif/disabled, loading, error, sukses, kosong) — lihat per komponen.
3. **Feedback berbahasa Indonesia** yang ramah dan spesifik, tanpa istilah teknis database (tanpa SQLSTATE, nama constraint, atau nama tabel).
4. **Validasi client hanya pendahulu.** Server tetap memvalidasi semuanya; pesan client tidak boleh mengklaim data "pasti valid".
5. **Data dari katalog.** Opsi jurusan, jenis dokumen, batas ukuran, dan MIME yang diizinkan dibaca dari `get_catalog`, bukan di-hardcode di komponen.

## 4. Inventaris komponen reusable

### 4.1 Button (tombol)

| Aspek | Spesifikasi |
|---|---|
| Varian | Primer (aksi utama: Simpan, Kirim Aplikasi, Masuk), Sekunder (Batal, Kembali), Berbahaya (Tarik Aplikasi, hanya untuk aksi destruktif dengan konfirmasi), Teks/link (aksi ringan) |
| Props | `label`, `varian`, `ukuran` (besar/sedang/kecil), `disabled`, `loading`, `ikon` (opsional), `tipe` (submit/button) |
| State | Default, hover, fokus (cincin fokus terlihat), aktif/ditekan, `disabled` (tidak dapat diklik, alasan terlihat bila relevan), `loading` (spinner + label tetap terbaca, tombol tidak dapat diklik ganda) |
| Pesan feedback | Saat loading: label berubah menjadi bentuk progresif, mis. "Menyimpan…", "Mengirim…", "Mengunggah…". Setelah sukses: toast (§4.9). Tombol submit ganda dicegah selama `loading` |
| Aturan | Satu aksi primer per layar/formulir. Aksi berbahaya selalu diikuti modal konfirmasi (§4.8) |

### 4.2 Input teks (TextInput)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | `full_name`, `birthplace`, `phone`, `email`, pencarian, `note` singkat |
| Props | `label`, `name`, `value`, `placeholder`, `maxLength`, `required`, `disabled`, `readOnly`, `hint` (teks bantuan), `error` |
| State | Kosong, terisi, fokus, `disabled`, `readOnly`, error (garis + pesan merah + ikon), sukses (opsional, centang kecil setelah validasi lolos) |
| Pesan feedback | Error tampil di bawah field, contoh: "Nama lengkap wajib diisi.", "Nama lengkap maksimal 150 karakter.", "Nomor telepon harus diawali + dan berisi 8–15 digit." |
| Aturan | Label selalu terlihat (bukan hanya placeholder). `maxLength` mengikuti DATA_DICTIONARY (150 / 100 / 254). Trim spasi di tepi sebelum validasi panjang |

### 4.3 Select (pilihan dropdown)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | Pilih jurusan (dari katalog), `gender`, filter status di antrean panitia, filter periode |
| Props | `label`, `name`, `options[]` (`value` + `label` tampil), `value`, `placeholder` ("Pilih…"), `required`, `disabled`, `error` |
| State | Tertutup, terbuka (daftar opsi), terpilih, kosong (belum memilih), `disabled`, error |
| Pesan feedback | "Pilih jurusan terlebih dahulu.", "Pilih jenis kelamin." |
| Aturan | Opsi jurusan: `value` = ID katalog, `label` = nama program dari katalog; kode `TKJT` tidak pernah muncul sebagai opsi. Opsi `gender`: label "Laki-laki" / "Perempuan", nilai `L` / `P`. Selalu ada opsi placeholder yang bukan nilai valid |

### 4.4 Textarea

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | `address` (1–1000 karakter), `note` perbaikan / penarikan / verifikasi (trim 1–1000) |
| Props | `label`, `name`, `value`, `placeholder`, `maxLength`, `rows`, `required`, `hint`, `error`, `showCounter` (penghitung karakter) |
| State | Kosong, terisi, fokus, `disabled`, error |
| Pesan feedback | "Alamat wajib diisi.", "Alamat maksimal 1000 karakter.", "Catatan perbaikan wajib diisi." (catatan wajib saat `correction_requested`). Penghitung karakter tampil sebagai "x / 1000" |
| Aturan | `note` tidak boleh diisi PII berlebih (password, token, diagnosis, data keluarga yang tidak perlu) — teks bantuan mengingatkan hal ini |

### 4.5 Date picker (pemilih tanggal)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | `birth_date` |
| Props | `label`, `name`, `value` (format `YYYY-MM-DD`), `min` (`1900-01-01`), `max` (hari ini), `required`, `error` |
| State | Kosong, terisi (tanggal valid), fokus, error (tanggal di luar rentang / format salah) |
| Pesan feedback | "Tanggal lahir wajib diisi.", "Tanggal lahir tidak boleh sebelum 1 Januari 1900.", "Tanggal lahir tidak boleh melebihi hari ini." |
| Aturan | Rentang dibatasi di kontrol (`min`/`max`) dan divalidasi ulang; input manual tetap diterima bila formatnya `YYYY-MM-DD` dan dalam rentang |

### 4.6 File upload (unggah berkas)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | `graduation_proof`, `family_card`, `photo`, dokumen pendukung |
| Props | `label` (nama jenis dokumen), `documentType` (kode katalog), `accept` (dari `allowed_mime_types`), `maxSizeBytes` (dari katalog, default 5 MiB), `currentFile` (slot terisi / kosong), `revision`, `verificationStatus`, `disabled` (terkunci bila status aplikasi tidak mengizinkan unggah) |
| State | Kosong (area seret-dan-letakkan + tombol "Pilih file"), file dipilih (nama + ukuran + tombol ganti/hapus pilihan), mengunggah (progress + "Memeriksa file…"), sukses (slot terisi: nama jenis, ukuran, revisi, status `pending`), error (lihat pesan), terkunci (status aplikasi di luar draft/perbaikan) |
| Pesan feedback | "Ukuran file melebihi 5 MiB.", "Format file tidak didukung. Gunakan PDF, JPEG, atau PNG." (untuk `photo`: "Gunakan JPEG atau PNG."), "File tidak dapat diunggah. Coba lagi.", "File berhasil diunggah. Menunggu verifikasi." |
| Aturan | Validasi client (tipe/ukuran) hanya pendahulu — server memeriksa isi/MIME/ukuran/malware. Penggantian file menaikkan `revision` dan mengembalikan status verifikasi ke `pending` (beri tahu pengguna). Jangan tampilkan `storage_key` atau nama file asli dari server sebagai tautan; tampilkan nama jenis + ukuran + revisi |

### 4.7 Card (kartu)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | Kartu ringkasan aplikasi, kartu jurusan, kartu hasil seleksi, kartu dokumen |
| Props | `title`, `subtitle` (opsional), `badge` (opsional, §4.10), `children` (isi), `actions[]` (tombol), `clickable` (opsional) |
| State | Default, hover (bila dapat diklik), loading (skeleton), kosong |
| Pesan feedback | — (isi kartu yang memberi feedback, mis. badge status dan teks hasil) |
| Aturan | Kartu hasil seleksi: bila `selection_result` null, tampilkan "Hasil belum diumumkan." — bukan kesimpulan gagal. Kartu aplikasi selalu menampilkan `registration_number` (`BSC-…`) dan status |

### 4.8 Modal (kotak dialog)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | Konfirmasi kirim aplikasi, konfirmasi tarik aplikasi, konfirmasi publish hasil (admin), pratinjau detail sebelum submit |
| Props | `title`, `body`, `confirmLabel`, `cancelLabel`, `danger` (boolean), `onConfirm`, `onCancel` |
| State | Terbuka, tertutup, konfirmasi sedang diproses (`loading` pada tombol konfirmasi) |
| Pesan feedback | Judul jelas ("Kirim aplikasi?", "Tarik aplikasi?"), isi menjelaskan akibat ("Aplikasi yang ditarik tidak dapat dikirim ulang dari status ini." — hanya tulis akibat yang memang ditetapkan; jangan inventarisasi aturan), tombol Batal selalu tersedia |
| Aturan | Modal dapat ditutup dengan tombol Batal, tombol ✕, dan tombol Escape; fokus terjebak di dalam modal selama terbuka; fokus kembali ke pemicu saat modal ditutup. Aksi berbahaya tidak pernah berjalan tanpa modal ini |

### 4.9 Toast (notifikasi singkat)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | Konfirmasi sukses/gagal global setelah aksi |
| Props | `type` (`success` / `error` / `info`), `message`, `duration`, `action` (opsional, mis. "Muat ulang") |
| State | Muncul, terlihat (beberapa detik), hilang (otomatis atau ditutup manual) |
| Pesan feedback | Sukses: "Profil tersimpan.", "Aplikasi terkirim.", "Dokumen berhasil diunggah.", "Keputusan tersimpan." Error: "Profil tidak dapat disimpan. Coba lagi." + request ID bila ada (lihat HF04 §7) |
| Aturan | Satu toast dalam satu waktu untuk satu aksi; toast error tidak menampilkan detail teknis; toast bukan pengganti pesan error di bawah field |

### 4.10 Badge status

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | Status aplikasi (8 nilai), status verifikasi dokumen (`pending` / `approved` / `correction_requested`), hasil seleksi (`accepted` / `waitlisted` / `rejected`) |
| Props | `status` (nilai API), `label` (usulan, lihat tabel), `tone` (warna/makna) |
| State | Satu badge per status; tidak ada state interaktif |
| Pemetaan label & tone yang diusulkan | `draft` → "Draf" (netral) · `submitted` → "Terkirim" (info) · `under_review` → "Sedang direview" (info) · `correction_requested` → "Perlu perbaikan" (peringatan) · `verified` → "Terverifikasi" (sukses) · `selection_in_progress` → "Seleksi berlangsung" (info) · `completed` → "Selesai" (sukses) · `withdrawn` → "Ditarik" (netral) · `pending` → "Menunggu verifikasi" (netral) · `approved` → "Disetujui" (sukses) · `accepted` → "Diterima" (sukses) · `waitlisted` → "Daftar tunggu" (peringatan) · `rejected` → "Tidak diterima" (netral — bukan merah menyala) |
| Aturan | Nilai yang disimpan tetap literal API; badge hanya tampilan. Warna tidak boleh menjadi satu-satunya pembeda status (selalu ada teks label) — lihat HF06 |

### 4.11 Timeline (riwayat status)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | Riwayat aplikasi (`history[]`), catatan verifikasi (`verifications[]`) |
| Props | `items[]` (`new_status`, `previous_status`, `changed_at`, `note`, `actorLabel`) |
| State | Terisi, kosong (draf baru: hanya "Draf dibuat"), loading (skeleton) |
| Pesan feedback | Entri kosong: "Belum ada pemeriksaan." untuk verifikasi |
| Aturan | Urutan kronologis; tiap entri menampilkan status baru (badge), waktu, dan catatan bila ada; aktor ditampilkan secukupnya ("Panitia") sesuai kebijakan sekolah |

### 4.12 Tabel (Table)

| Aspek | Spesifikasi |
|---|---|
| Dipakai untuk | Daftar aplikasi saya, antrean panitia, daftar akun (admin) |
| Props | `columns[]`, `rows[]`, `sortBy` (opsional), `pagination` (`limit` 1–100, default 50; `offset`), `emptyMessage`, `loading` |
| State | Loading (skeleton baris), terisi, kosong, error |
| Pesan feedback | Kosong: "Belum ada aplikasi." / "Tidak ada aplikasi pada antrean ini." Error: "Daftar tidak dapat dimuat. Coba lagi." |
| Aturan | Kolom daftar aplikasi: nomor pendaftaran (`BSC-…`), periode, jurusan (nama dari katalog), status (badge), tanggal dibuat. Baris dapat diklik untuk membuka detail. Paginasi mengikuti `limit`/`offset` dari `list_applications` |

### 4.13 Komponen pendukung lainnya

| Komponen | Dipakai untuk | Catatan |
|---|---|---|
| Alert / Banner | Pemberitahuan di atas layar (mis. periode hampir tutup, perbaikan diminta) | Varian info/peringatan/error; selalu ada teks, bukan hanya warna; dapat ditutup bila bukan informasi kritis |
| Skeleton | State loading kartu/tabel/formulir | Meniru bentuk konten yang akan muncul; bukan spinner di tengah halaman kosong |
| EmptyState | Layar/daftar kosong | Ikon + judul + penjelasan + aksi berikutnya ("Buat aplikasi") |
| Breadcrumb / langkah (Stepper) | Alur pendaftaran: Profil → Jurusan → Dokumen → Pratinjau & Kirim | Menunjukkan langkah aktif/selesai/belum; langkah dapat diklik kembali bila masih dapat diubah (draft/perbaikan) |
| Avatar / inisial | Identitas pengguna di navigasi | Inisial dari `full_name`; bukan foto profil (tidak ada field foto profil) |
| Search & Filter | Antrean panitia: filter periode, status, pencarian nomor pendaftaran | Filter status memakai 8 nilai API; pencarian nomor `BSC-…` |
| Pagination | Daftar aplikasi / antrean | Tombol Sebelumnya/Berikutnya + info "Menampilkan x–y"; mengikuti `limit`/`offset` |

## 5. Spesifikasi formulir (tabel wireframe deskriptif)

> Bukan kode. Setiap tabel dibaca dari atas ke bawah sebagai urutan tampil di layar. Contoh isi memakai data fiktif.

### 5.1 Formulir registrasi akun

| # | Elemen | Label | Placeholder / isi | Validasi tampilan | Pesan error |
|---|---|---|---|---|---|
| 1 | Judul + deskripsi | "Buat Akun" | "Daftar sebagai calon siswa SMK Bina Sarana Cendekia." | — | — |
| 2 | TextInput | Email | `calon.siswa@example.test` | Wajib; pola email; maks 254; lowercase/trim | "Masukkan alamat email yang valid.", "Email maksimal 254 karakter." |
| 3 | TextInput (password) | Password | "Minimal sesuai ketentuan sekolah*" | Wajib; aturan panjang ditetapkan backend (K1) | "Password wajib diisi." + aturan backend bila ada |
| 4 | TextInput (password) | Konfirmasi password | "Ulangi password" | Wajib; harus sama dengan password | "Konfirmasi password tidak sama." |
| 5 | Button primer | "Buat Akun" | — | Nonaktif saat loading / bila ada error yang belum diperbaiki | — |
| 6 | Teks bantuan | "Sudah punya akun? Masuk" (tautan ke login) | — | — | — |
| 7 | Toast sukses | — | "Akun dibuat. Silakan masuk." | — | Bila email sudah terdaftar: "Email sudah terdaftar." (409 generik, tanpa detail) |

\* Aturan panjang/kompleksitas password ditetapkan backend (SECURITY.md K1); formulir hanya menampilkan aturan yang disahkan backend, tidak mengarang angka.

### 5.2 Formulir profil — 7 field

| # | Elemen | Label | Placeholder / contoh fiktif | Validasi tampilan | Pesan error |
|---|---|---|---|---|---|
| 1 | Judul + stepper | "Biodata Calon Siswa" (Langkah 1 dari 4) | — | — | — |
| 2 | TextInput | Nama lengkap | "Calon Siswa Contoh" | Wajib; trim 1–150 | "Nama lengkap wajib diisi.", "Nama lengkap maksimal 150 karakter." |
| 3 | TextInput | Tempat lahir | "Jakarta" | Wajib sebelum submit; trim 1–100 | "Tempat lahir wajib diisi.", "Tempat lahir maksimal 100 karakter." |
| 4 | Date picker | Tanggal lahir | `2008-05-17` | Wajib sebelum submit; min `1900-01-01`, maks hari ini | "Tanggal lahir wajib diisi.", "Tanggal lahir tidak boleh sebelum 1 Januari 1900.", "Tanggal lahir tidak boleh melebihi hari ini." |
| 5 | Select | Jenis kelamin | "Pilih jenis kelamin" → Laki-laki / Perempuan | Wajib sebelum submit; nilai `L` / `P` | "Pilih jenis kelamin." |
| 6 | Textarea | Alamat | "Jl. Contoh No. 1, Jakarta" | Wajib sebelum submit; trim 1–1000; penghitung karakter | "Alamat wajib diisi.", "Alamat maksimal 1000 karakter." |
| 7 | TextInput | Nomor telepon | `+6281234567890` | Wajib sebelum submit; E.164: `+` + 8–15 digit, digit pertama bukan nol | "Nomor telepon wajib diisi.", "Nomor telepon harus diawali + dan berisi 8–15 digit." |
| 8 | Teks info | Email akun (read-only) | `calon.siswa@example.test` | Bukan field yang dapat diubah di formulir ini | — |
| 9 | Button primer | "Simpan Profil" | — | Nonaktif saat loading | — |
| 10 | Toast | — | "Profil tersimpan." | — | "Profil tidak dapat disimpan. Periksa isian dan coba lagi." |

Catatan: field nullable di database memungkinkan draf belum lengkap; validasi "wajib sebelum submit" ditegakkan saat submit (dan ditampilkan sebagai daftar kekurangan di layar pratinjau — lihat HF04 §5). Tombol "Simpan Profil" menyimpan draf profil walaupun sebagian field masih kosong, sesuai `save_profile` (upsert).

### 5.3 Formulir pilih jurusan & periode

| # | Elemen | Label | Placeholder / isi | Validasi tampilan | Pesan error |
|---|---|---|---|---|---|
| 1 | Judul + stepper | "Pilih Jurusan" (Langkah 2 dari 4) | — | — | — |
| 2 | Select / kartu radio | Periode penerimaan | Daftar periode aktif dari katalog: nama + tahun ajaran (`YYYY/YYYY`) + tanggal buka/tutup | Wajib; hanya periode aktif yang dapat dipilih | "Pilih periode penerimaan." |
| 3 | Select / kartu radio | Program keahlian | 5 kartu dari katalog: nama program + deskripsi (maks 2000 karakter) — TJKT, PPLG, ANIMASI, MPLB, OTOMOTIF | Wajib; hanya jurusan aktif yang dapat dipilih | "Pilih program keahlian." |
| 4 | Alert info | — | "Pilihan jurusan dapat diubah selama aplikasi masih draf atau perbaikan." | — | — |
| 5 | Button primer | "Lanjut ke Dokumen" / "Simpan Pilihan" | — | Nonaktif saat loading | — |
| 6 | Toast | — | "Pilihan tersimpan." / "Aplikasi draf dibuat. Nomor pendaftaran: BSC-…" | — | "Pilihan tidak dapat disimpan. Coba lagi." Bila sudah ada satu aplikasi pada periode yang sama: "Anda sudah memiliki aplikasi pada periode ini." (409 generik) |

### 5.4 Formulir unggah dokumen

| # | Elemen | Label | Persyaratan tampil | Validasi tampilan | Pesan error |
|---|---|---|---|---|---|
| 1 | Judul + stepper | "Unggah Dokumen" (Langkah 3 dari 4) | "Unggah 3 dokumen wajib. Maksimal 5 MiB per file." | — | — |
| 2 | File upload | Ijazah atau SKL (`graduation_proof`) | "PDF, JPEG, atau PNG. Maks 5 MiB. Satu file." | Wajib sebelum submit; tipe & ukuran diperiksa client lalu server | "Dokumen ini wajib diunggah.", "Format file tidak didukung. Gunakan PDF, JPEG, atau PNG.", "Ukuran file melebihi 5 MiB." |
| 3 | File upload | Kartu Keluarga (`family_card`) | "PDF, JPEG, atau PNG. Maks 5 MiB. Satu file." | Wajib sebelum submit | Sama seperti di atas |
| 4 | File upload | Pas foto (`photo`) | "JPEG atau PNG saja. Maks 5 MiB. Satu file." | Wajib sebelum submit; **PDF ditolak** | "Format file tidak didukung. Gunakan JPEG atau PNG.", "Ukuran file melebihi 5 MiB." |
| 5 | File upload | Dokumen pendukung (opsional) | "Sesuai jenis yang dipilih di katalog. Maks 5 MiB." | Opsional; tipe & ukuran mengikuti `allowed_mime_types` / `max_size_bytes` jenisnya | "Format file tidak didukung.", "Ukuran file melebihi batas jenis ini." |
| 6 | Daftar slot terisi | Per slot: nama jenis, ukuran, revisi, badge status verifikasi | — | Penggantian file: beri tahu "Revisi naik ke-2; status verifikasi kembali menunggu." | — |
| 7 | Button primer | "Lanjut ke Pratinjau" | — | Nonaktif bila 3 dokumen wajib belum lengkap? Tidak — tombol tetap aktif, pratinjau menampilkan kekurangan (lebih ramah daripada memblokir) | — |

### 5.5 Layar pratinjau & kirim (Langkah 4 dari 4)

| # | Elemen | Isi |
|---|---|---|
| 1 | Judul | "Pratinjau Aplikasi" |
| 2 | Card profil | 7 field + email akun (read-only); tombol "Ubah" kembali ke Langkah 1 (bila masih draf/perbaikan) |
| 3 | Card jurusan | Periode + nama program + deskripsi singkat; tombol "Ubah" (bila masih draf/perbaikan) |
| 4 | Card dokumen | 3 slot wajib + pendukung: status terisi/belum, ukuran, revisi |
| 5 | Daftar kekurangan | Bila ada: "Masih kurang: tanggal lahir, pas foto." — tiap item menautkan ke langkah terkait |
| 6 | Button primer "Kirim Aplikasi" | Membuka modal konfirmasi; nonaktif saat loading; bila kekurangan masih ada, modal menampilkan daftar kekurangan dan tombol kirim tetap nonaktif sampai lengkap |
| 7 | Modal konfirmasi | "Kirim aplikasi?" + ringkasan (nomor `BSC-…`, jurusan, periode) + "Setelah dikirim, biodata yang tersimpan adalah snapshot saat pengiriman." |
| 8 | Toast sukses | "Aplikasi terkirim." + nomor pendaftaran |

### 5.6 Formulir panitia — verifikasi dokumen & ubah status

| # | Elemen | Label | Validasi tampilan | Pesan error |
|---|---|---|---|---|
| 1 | Detail aplikasi + dokumen | Nama jenis, ukuran, revisi, badge verifikasi; tombol unduh (stream server, bukan tautan `storage_key`) | — | — |
| 2 | Select keputusan | "Setujui" / "Minta perbaikan" | Wajib memilih | "Pilih keputusan verifikasi." |
| 3 | Textarea `note` | "Catatan perbaikan" | **Wajib bila "Minta perbaikan"**; trim 1–1000; penghitung karakter; tanpa PII berlebih | "Catatan perbaikan wajib diisi bila meminta perbaikan.", "Catatan maksimal 1000 karakter." |
| 4 | Button primer | "Simpan Keputusan" | Nonaktif saat loading; hanya tampil saat aplikasi `under_review` (di luar itu tombol disembunyikan — kontrol UI ini bukan pengaman, server tetap menolak) | "Keputusan tidak dapat disimpan. Status aplikasi mungkin sudah berubah — muat ulang." |
| 5 | Toast | "Keputusan tersimpan." | — | Lihat pesan error di atas |

### 5.7 Formulir admin — hasil seleksi & kelola akun

| # | Elemen | Label | Validasi tampilan | Pesan error |
|---|---|---|---|---|
| 1 | Select `outcome` | "Diterima" / "Daftar tunggu" / "Tidak diterima" (nilai `accepted` / `waitlisted` / `rejected`) | Wajib memilih | "Pilih hasil seleksi." |
| 2 | Textarea `note` | "Keterangan untuk siswa" | Trim 1–1000; penghitung karakter | "Keterangan maksimal 1000 karakter." |
| 3 | Date picker + waktu | "Jadwal pengumuman" (`announcement_at`) | Wajib; `published_at` harus ≥ nilai ini | "Jadwal pengumuman wajib diisi." |
| 4 | Button primer | "Simpan Hasil (Draf)" | Hanya admin; nonaktif saat loading | "Hasil tidak dapat disimpan. Coba lagi." |
| 5 | Button sekunder + modal | "Publikasikan Hasil" | Hanya tampil bila jadwal terpenuhi dan aplikasi `completed`; modal konfirmasi wajib | "Hasil belum dapat dipublikasikan. Periksa jadwal dan status aplikasi." |
| 6 | Kelola akun: Select role + Select status | Role (`applicant` / `committee` / `admin`), status (`active` / `suspended` / `closed`) | Admin mengelola akun **lain**; siswa berprofil tetap `applicant` | "Perubahan tidak dapat disimpan." |

## 6. Aturan validasi tampilan lintas formulir

1. **Validasi saat interaksi (on blur) + saat submit.** Error tidak muncul sebelum pengguna menyentuh field, kecuali setelah percobaan submit yang gagal.
2. **Satu pesan per field**, yang paling relevan didahulukan: kosong → format → panjang.
3. **Penanda wajib** berupa teks "(wajib)" di label, bukan hanya tanda bintang tanpa keterangan.
4. **Tidak ada pesan teknis.** Pesan error tidak menyebut nama tabel, kolom, constraint, SQLSTATE, atau kode error database.
5. **Server adalah penentu akhir.** Bila server menolak isian yang lolos validasi client, tampilkan pesan generik + penanda field bila aman (lihat HF04 §7.2).
6. **Contoh format ditampilkan** untuk field berpola (`phone`: `+6281234567890`; `birth_date`: `YYYY-MM-DD`).

## 7. Daftar periksa sebelum implementasi (untuk Samuel)

- [ ] Sahkan inventaris komponen §4 (nama, varian, state, pesan).
- [ ] Sahkan urutan dan label formulir §5.1–§5.7.
- [ ] Sahkan pemetaan label badge status §4.10.
- [ ] Sahkan aturan bahwa tombol "Lanjut ke Pratinjau" tetap aktif walau dokumen belum lengkap (kekurangan tampil di pratinjau).
- [ ] Sahkan teks bantuan/placeholder berbahasa Indonesia.

## Status review

**Review PENDING — persetujuan BELUM diperoleh.** Dokumen ini menunggu review oleh **Samuel** (BA/UI/UX). Tidak ada persetujuan atas inventaris komponen, spesifikasi formulir, maupun label yang diusulkan yang diklaim telah diberikan oleh Samuel, Fadlan, Rizki, atau siapa pun.
