import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import { STATUS_LABEL } from '@/lib/utils';
import type { StaffDashboard } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorState, PageHeader } from '@/components/shared/states';
import { CardGridSkeleton } from '@/components/shared/skeletons';

export default function PanitiaDashboard() {
  const dashboard = useQuery({
    queryKey: ['dashboard', 'panitia'],
    queryFn: () => api.get<StaffDashboard>('/dashboard/panitia'),
  });

  if (dashboard.isLoading) return <CardGridSkeleton cards={5} />;
  if (dashboard.isError) return <ErrorState onRetry={() => dashboard.refetch()} />;

  const { counts, total, recent } = dashboard.data!;

  return (
    <div>
      <PageHeader title="Dashboard Panitia" description="Ringkasan antrean pendaftaran." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">{STATUS_LABEL[status] ?? status}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{count}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary-700" />
              <div>
                <p className="text-xs text-slate-500">Total Pendaftar</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Pendaftar Terbaru</h3>
            <Link to="/panitia/pendaftaran">
              <Button variant="outline" size="sm">Lihat semua</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {recent.map((a) => (
              <div key={a.user_id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{a.full_name}</p>
                  <p className="text-xs text-slate-500">{a.registration_number ?? '-'}</p>
                </div>
                {a.status && <span className="text-xs text-slate-500">{STATUS_LABEL[a.status]}</span>}
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-slate-500">Belum ada pendaftar.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
