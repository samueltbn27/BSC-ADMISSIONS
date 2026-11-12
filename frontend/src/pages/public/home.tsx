import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';
import type { Catalog } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/shared/states';

const steps = [
  { title: 'Buat akun', desc: 'Daftar dengan email dan masuk ke akun calon siswa.' },
  { title: 'Lengkapi formulir', desc: 'Simpan biodata dan pilih program keahlianmu.' },
  { title: 'Kirim berkas', desc: 'Unggah dokumen dummy, lalu kirim pendaftaran.' },
  { title: 'Pantau verifikasi', desc: 'Lihat hasil pemeriksaan dan catatan dari panitia.' },
];

export default function Home() {
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: () => api.get<Catalog>('/catalog') });
  const periods = (catalog.data?.periods ?? []).filter((p) => p.is_active && new Date(p.opens_at) <= new Date() && new Date(p.closes_at) > new Date());
  return <div>
    <section className="bg-primary-950 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
        <div>
          <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200"><span className="h-2 w-2 rounded-full bg-sky-300" /> BSC Admissions · Penerimaan Murid Baru</p>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">Langkah pertama menuju masa depanmu.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-blue-100">Mulai perjalanan di SMK Bina Sarana Cendekia. Lengkapi pendaftaran, pilih jurusan, dan pantau verifikasi dalam satu tempat.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register"><Button size="lg" className="bg-white text-primary-950 hover:bg-blue-50">Daftar Sekarang <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/login"><Button size="lg" variant="outline" className="border-blue-300/40 bg-transparent text-white hover:bg-white/10">Login ke Akun</Button></Link>
          </div>
          <p className="mt-5 text-xs leading-5 text-blue-200">Prototype akademik untuk UTS Manajemen Proyek.<br />Seluruh data pendaftar dalam demo bersifat sintetis.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white text-slate-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-6"><span className="font-semibold">Perjalanan pendaftaran</span><BookOpen className="h-5 w-5 text-primary-700" /></div>
          <ol className="space-y-6 p-6 sm:p-8">{steps.map((step, i) => <li key={step.title} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-primary-800">0{i + 1}</span>
            <div><p className="font-semibold">{step.title}</p><p className="mt-1 text-sm leading-6 text-slate-500">{step.desc}</p></div>
          </li>)}</ol>
          <div className="border-t border-blue-100 bg-blue-50 px-6 py-4 text-xs font-medium text-primary-900">Simpan draft, lanjutkan selama periode demo aktif.</div>
        </div>
      </div>
    </section>
    {catalog.isLoading ? <LoadingState /> : catalog.isError ? <ErrorState message="Katalog belum dapat dimuat. Periksa koneksi database." onRetry={() => catalog.refetch()} /> : <>
      <section className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-7">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-primary-700">Periode pendaftaran contoh</p><h2 className="mt-1 text-lg font-bold">{periods[0]?.name ?? 'Belum ada periode aktif'}</h2></div>
        {periods[0] ? <p className="text-sm text-slate-600">{formatDate(periods[0].opens_at)} — {formatDate(periods[0].closes_at)}<span className="ml-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Dibuka</span></p> : <p className="text-sm text-slate-500">Panitia perlu mengaktifkan periode sebelum pendaftaran dibuat.</p>}
      </div></section>
      <section className="mx-auto max-w-6xl px-5 py-16" id="jurusan">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-700">Program keahlian</p><h2 className="text-3xl font-bold tracking-tight">Temukan bidang pilihanmu.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Lima pilihan jurusan dari katalog proyek. Nama dan persyaratan resmi menunggu konfirmasi sekolah.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{catalog.data!.majors.map((m, i) => <Card key={m.id}><CardContent className="p-6"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-400">0{i + 1}</span><span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-primary-800">{m.code}</span></div><h3 className="mt-5 text-lg font-semibold leading-7">{m.name}</h3><p className="mt-2 text-sm text-slate-500">{m.description}</p></CardContent></Card>)}</div>
      </section>
      <section className="border-y border-slate-200 bg-white" id="persyaratan"><div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2">
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-700">Persiapan pendaftaran</p><h2 className="text-3xl font-bold tracking-tight">Siapkan berkasmu.<br />Lanjutkan dengan tenang.</h2><p className="mt-4 max-w-md text-sm leading-7 text-slate-500">Lengkapi nama, tempat dan tanggal lahir, jenis kelamin, alamat, serta nomor telepon. Untuk demo, gunakan file dummy yang dibuat script setup.</p><Link to="/alur-pendaftaran" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-800">Pelajari tahapan pendaftaran <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="divide-y divide-slate-100">{catalog.data!.document_types.map((t) => <div key={t.id} className="flex items-start gap-3 py-4 first:pt-0"><Check className="mt-1 h-5 w-5 shrink-0 text-primary-700" /><div><h3 className="font-semibold">{t.name} <span className="text-xs font-normal text-slate-500">· {t.is_required ? 'Wajib' : 'Opsional'}</span></h3><p className="mt-1 text-sm text-slate-500">{t.allowed_mime_types.map((m) => (m.split('/')[1] ?? m).toUpperCase()).join(' / ')} · maksimal {formatBytes(t.max_size_bytes)}</p></div></div>)}</div>
      </div></section>
    </>}
  </div>;
}
