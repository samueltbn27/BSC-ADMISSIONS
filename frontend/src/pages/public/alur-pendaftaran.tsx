import { CheckCircle2, ClipboardList, FileCheck2, FileText, Search, Trophy, UserPlus } from 'lucide-react';

const ALUR = [
  { icon: UserPlus, title: 'Buat Akun', desc: 'Calon siswa membuat akun dengan email aktif, lalu masuk ke dashboard.' },
  { icon: ClipboardList, title: 'Lengkapi Biodata', desc: 'Isi biodata lengkap (nama, tempat/tanggal lahir, jenis kelamin, alamat, telepon).' },
  { icon: FileText, title: 'Buat Pendaftaran', desc: 'Pilih periode aktif dan jurusan tujuan, lalu simpan sebagai draft.' },
  { icon: FileCheck2, title: 'Unggah Dokumen', desc: 'Unggah ijazah/SKL, kartu keluarga, dan pas foto (format PDF/JPG/PNG).' },
  { icon: CheckCircle2, title: 'Kirim Formulir', desc: 'Submit pendaftaran setelah data dan dokumen lengkap.' },
  { icon: Search, title: 'Verifikasi Panitia', desc: 'Panitia memeriksa berkas; jika perlu perbaikan, siswa mendapat catatan.' },
  { icon: Trophy, title: 'Pengumuman Hasil', desc: 'Admin memublikasikan hasil seleksi sesuai jadwal; siswa dapat melihat hasilnya.' },
];

export default function AlurPendaftaran() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Alur Pendaftaran</h1>
        <p className="mt-2 text-slate-500">Ikuti langkah-langkah berikut secara berurutan</p>
      </div>
      <div className="space-y-0">
        {ALUR.map((step, i) => (
          <div key={step.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-900 text-white">
                <step.icon className="h-5 w-5" />
              </div>
              {i < ALUR.length - 1 && <div className="w-px flex-1 bg-slate-200" />}
            </div>
            <div className="pb-10">
              <h2 className="font-semibold text-slate-900">{step.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
