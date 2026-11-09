import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Search,
  UserPlus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Catalog } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/shared/states';

const STEPS = [
  { icon: UserPlus, title: '1. Buat Akun', desc: 'Registrasi dengan email aktif dan kata sandi.' },
  { icon: ClipboardList, title: '2. Isi Formulir', desc: 'Lengkapi biodata dan pilih jurusan.' },
  { icon: FileCheck2, title: '3. Unggah Dokumen', desc: 'Unggah ijazah/SKL, kartu keluarga, dan pas foto.' },
  { icon: Search, title: '4. Verifikasi', desc: 'Panitia memeriksa kelengkapan berkas.' },
];

export default function Home() {
  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get<Catalog>('/catalog'),
  });

  const activePeriods = (catalog.data?.periods ?? []).filter(
    (p) => p.is_active && new Date(p.closes_at) > new Date()
  );

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center lg:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
            <GraduationCap className="h-4 w-4" />
            Tahun Ajaran 2026/2027
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight lg:text-5xl">
            Penerimaan Murid Baru SMK Bina Sarana Cendekia
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-200">
            Daftar secara online, pantau status pendaftaran, dan lihat hasil seleksi melalui sistem PPDB resmi sekolah.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary-900 hover:bg-slate-100">
                Daftar Sekarang <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/alur-pendaftaran">
              <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                Lihat Alur PPDB
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {catalog.isLoading ? (
        <LoadingState />
      ) : catalog.isError ? (
        <ErrorState message="Gagal memuat katalog jurusan" onRetry={() => catalog.refetch()} />
      ) : (
        <>
          <section className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Program Keahlian</h2>
              <p className="mt-2 text-sm text-slate-500">Lima program keahlian unggulan SMK Bina Sarana Cendekia</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.data!.majors.map((major) => (
                <Card key={major.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                        <GraduationCap className="h-5 w-5 text-primary-800" />
                      </div>
                      <span className="text-xs font-bold tracking-wide text-primary-700">{major.code}</span>
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">{major.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{major.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="bg-white py-14">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Tahapan Pendaftaran</h2>
                <p className="mt-2 text-sm text-slate-500">Empat langkah mudah menuju SMK Bina Sarana Cendekia</p>
              </div>
              <div className="grid gap-5 md:grid-cols-4">
                {STEPS.map((step) => (
                  <Card key={step.title}>
                    <CardContent className="p-6">
                      <step.icon className="h-8 w-8 text-primary-700" />
                      <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {activePeriods.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 py-14">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Jadwal PPDB Aktif</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {activePeriods.map((period) => (
                  <Card key={period.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                          <CalendarDays className="h-5 w-5 text-primary-800" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{period.name}</h3>
                          <p className="text-xs text-slate-500">Tahun Ajaran {period.academic_year}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Dibuka</p>
                          <p className="font-medium text-slate-800">{formatDate(period.opens_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ditutup</p>
                          <p className="font-medium text-slate-800">{formatDate(period.closes_at)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="bg-primary-900 py-12 text-white">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold">Siap menjadi bagian dari keluarga besar kami?</h3>
                  <p className="text-sm text-slate-200">Pendaftaran dibuka sesuai jadwal periode aktif.</p>
                </div>
              </div>
              <Link to="/register">
                <Button size="lg" className="bg-white text-primary-900 hover:bg-slate-100">
                  Daftar Sekarang
                </Button>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
