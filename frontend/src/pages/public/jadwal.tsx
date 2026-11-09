import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Catalog } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';

export default function Jadwal() {
  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get<Catalog>('/catalog'),
  });

  if (catalog.isLoading) return <LoadingState />;
  if (catalog.isError) return <ErrorState onRetry={() => catalog.refetch()} />;

  const periods = catalog.data!.periods;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Jadwal PPDB</h1>
        <p className="mt-2 text-slate-500">Jadwal resmi pendaftaran murid baru</p>
      </div>

      {periods.length === 0 ? (
        <EmptyState message="Belum ada periode pendaftaran yang diumumkan." />
      ) : (
        <div className="space-y-4">
          {periods.map((period) => (
            <Card key={period.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${period.is_active ? 'bg-primary-50' : 'bg-slate-100'}`}>
                    <CalendarDays className={`h-6 w-6 ${period.is_active ? 'text-primary-800' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold text-slate-900">{period.name}</h2>
                      <Badge className={period.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                        {period.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">Tahun Ajaran {period.academic_year}</p>
                  </div>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
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
      )}
    </div>
  );
}
