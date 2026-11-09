import { School } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfilSekolah() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-900">
          <School className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Profil Sekolah</h1>
        <p className="mt-2 text-slate-500">SMK Bina Sarana Cendekia</p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Konten placeholder sementara. Teks ini dapat diperbarui oleh administrator melalui konfigurasi konten publikt.
      </div>

      <Card>
        <CardContent className="space-y-6 p-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tentang Kami</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              SMK Bina Sarana Cendekia merupakan sekolah menengah kejuruan yang menyelenggarakan pendidikan
              kejuruan dengan fokus pada penguasaan keterampilan siap kerja. Sistem PPDB online ini adalah
              jalur resmi pendaftaran murid baru.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Visi</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              Menjadi lembaga pendidikan kejuruan yang unggul, berkarakter, dan mampu mencetak lulusan yang
              kompeten di bidangnya.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Misi</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              <li>Menyelenggarakan pembelajaran yang relevan dengan kebutuhan industri.</li>
              <li>Membina karakter dan profesionalisme peserta didik.</li>
              <li>Menjalin kemitraan dengan dunia usaha dan industri.</li>
            </ul>
          </div>
          <div className="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Alamat</p>
              <p className="text-sm text-slate-700">Jl. Bina Sarana Cendekia (placeholder)</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Kontak</p>
              <p className="text-sm text-slate-700">ppdb@bsc.sch.id (placeholder)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
