import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { STATUS_LABEL } from '@/lib/utils';
import type { AdminDashboard } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared/states';

export default function AdminDashboard() {
  const dashboard = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.get<AdminDashboard>('/dashboard/admin'),
  });

  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.isError) return <ErrorState onRetry={() => dashboard.refetch()} />;

  const d = dashboard.data!;

  return (
    <div>
      <PageHeader title="Dashboard Admin" description="Ringkasan data PPDB." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Total Pengguna</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{d.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Total Pendaftar</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{d.totalApplicants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Periode Aktif</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {d.periods.filter((p) => p.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Pengumuman</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{d.announcementCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Pengguna per Role</h3>
            <div className="space-y-3">
              {Object.entries(d.roleCounts).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <span className="text-sm text-slate-700">
                    {role === 'applicant' ? 'Calon Siswa' : role === 'committee' ? 'Panitia' : 'Admin'}
                  </span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Pendaftar per Status</h3>
            <div className="space-y-3">
              {Object.entries(d.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <span className="text-sm text-slate-700">{STATUS_LABEL[status] ?? status}</span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
