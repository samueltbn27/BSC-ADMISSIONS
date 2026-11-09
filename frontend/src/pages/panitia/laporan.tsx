import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { STATUS_LABEL } from '@/lib/utils';
import type { StaffDashboard } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared/states';

export default function PanitiaLaporan() {
  const dashboard = useQuery({
    queryKey: ['dashboard', 'panitia'],
    queryFn: () => api.get<StaffDashboard>('/dashboard/panitia'),
  });

  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.isError) return <ErrorState onRetry={() => dashboard.refetch()} />;

  const { counts, total } = dashboard.data!;

  return (
    <div>
      <PageHeader title="Laporan" description="Rekapitulasi jumlah pendaftar berdasarkan status." />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <div className="space-y-3">
            {Object.entries(counts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                <span className="text-sm text-slate-700">{STATUS_LABEL[status] ?? status}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="font-medium text-slate-900">Total</span>
              <span className="text-lg font-bold text-primary-800">{total}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
