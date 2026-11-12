import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileText, ListChecks, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, STATUS_LABEL } from '@/lib/utils';
import type { StudentDashboard } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState, PageHeader } from '@/components/shared/states';
import { CardGridSkeleton } from '@/components/shared/skeletons';
import { StatusBadge } from '@/components/shared/status-badge';

export default function SiswaDashboard() {
  const dashboard = useQuery({
    queryKey: ['dashboard', 'siswa'],
    queryFn: () => api.get<StudentDashboard>('/dashboard/siswa'),
  });

  if (dashboard.isLoading) return <CardGridSkeleton cards={3} />;
  if (dashboard.isError) return <ErrorState message="Gagal memuat dashboard" onRetry={() => dashboard.refetch()} />;

  const { profile, applications, majors } = dashboard.data!;
  const profileComplete = Boolean(
    profile?.full_name && profile?.birthplace && profile?.birth_date && profile?.gender && profile?.address && profile?.phone
  );

  const majorName = (id: number) => majors.find((m) => m.id === id)?.name ?? `#${id}`;

  return (
    <div>
      <PageHeader title={profile?.full_name ? `Halo, ${profile.full_name}` : 'Dashboard Calon Siswa'} description="Lengkapi formulir, unggah berkas, dan pantau verifikasi pendaftaran." action={<Link to="/siswa/biodata"><Button>Lengkapi Formulir</Button></Link>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
              <UserRound className="h-6 w-6 text-primary-800" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Biodata</p>
              <p className="text-sm font-semibold text-slate-900">
                {profileComplete ? 'Lengkap' : 'Belum Lengkap'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
              <ListChecks className="h-6 w-6 text-primary-800" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Pendaftaran</p>
              <p className="text-sm font-semibold text-slate-900">{applications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
              <FileText className="h-6 w-6 text-primary-800" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Langkah Berikutnya</p>
              <p className="text-sm font-semibold text-slate-900">
                {!profileComplete ? 'Lengkapi biodata' : applications.length === 0 ? 'Buat pendaftaran' : applications[0]?.status === 'verified' ? 'Verifikasi selesai' : applications[0]?.status === 'submitted' || applications[0]?.status === 'under_review' ? 'Tunggu pemeriksaan panitia' : applications[0]?.status === 'correction_requested' ? 'Perbaiki berkas' : 'Lengkapi dokumen'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pendaftaran Saya</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <EmptyState
              message="Anda belum membuat pendaftaran."
              action={
                <Link to="/siswa/pendaftaran">
                  <Button size="sm">Buat Pendaftaran</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{majorName(app.major_id)}</p>
                    <p className="text-xs text-slate-500">
                      {app.registration_number} · dibuat {formatDate(app.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <Link to={`/siswa/status?app=${app.id}`}>
                      <Button variant="outline" size="sm">Detail <ArrowRight className="h-3.5 w-3.5" /></Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {applications.some((a) => a.status === 'draft') && (
        <p className="mt-4 text-sm text-slate-500">
          Status saat ini: {applications.map((a) => STATUS_LABEL[a.status]).join(', ')}. Lanjutkan dari menu pendaftaran.
        </p>
      )}
    </div>
  );
}
