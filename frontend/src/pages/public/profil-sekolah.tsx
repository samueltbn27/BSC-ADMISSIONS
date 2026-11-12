import { Card, CardContent } from '@/components/ui/card';
export default function ProfilSekolah() {
  return <section className="mx-auto max-w-4xl px-4 py-14">
    <p className="mb-3 text-sm font-semibold text-primary-700">TENTANG PROYEK</p>
    <h1 className="mb-6 text-3xl font-bold">SMK Bina Sarana Cendekia</h1>
    <Card><CardContent className="space-y-4 p-8 leading-relaxed text-slate-600">
      <p>BSC Admissions adalah prototype akademik Sistem Penerimaan Murid Baru SMK Bina Sarana Cendekia untuk mata kuliah Manajemen Proyek Perangkat Lunak.</p>
      <p>Demo memperagakan registrasi akun, pengisian biodata, pemilihan jurusan, unggah berkas, dan verifikasi panitia menggunakan data sintetis.</p>
      <p>Alamat, kontak, akreditasi, visi, misi, dan jadwal resmi sekolah belum tersedia dalam sumber proyek. Informasi tersebut menunggu konfirmasi sekolah dan tim Business Analyst.</p>
    </CardContent></Card>
  </section>;
}
