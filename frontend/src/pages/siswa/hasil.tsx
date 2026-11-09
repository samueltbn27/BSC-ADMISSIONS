import { useQuery } from '@tanstack/react-query';
import { Clock, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { SelectionResult } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared/states';
import { OutcomeBadge } from '@/components/shared/status-badge';

interface ResultRow extends SelectionResult {
  applicationId: string;
  registrationNumber: string;
}

export default function SiswaHasil() {
  const results = useQuery({
    queryKey: ['hasil', 'me'],
    queryFn: () => api.get<{ results: ResultRow[] }>('/hasil-seleksi/me'),
  });

  if (results.isLoading) return <LoadingState />;
  if (results.isError) return <ErrorState onRetry={() => results.refetch()} />;

  const list = results.data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Hasil Seleksi"
        description="Hasil seleksi yang telah dipublikasikan panitia."
      />

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Clock className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              Hasil seleksi belum diumumkan. Periksa kembali sesuai jadwal pengumuman.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((r) => (
            <Card key={r.applicationId}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                    <Trophy className="h-6 w-6 text-primary-800" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{r.registrationNumber}</p>
                    <p className="text-xs text-slate-500">
                      Diumumkan {formatDate(r.announcement_at, true)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <OutcomeBadge outcome={r.outcome} />
                  {r.note && <p className="mt-2 max-w-sm text-sm text-slate-600">{r.note}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
