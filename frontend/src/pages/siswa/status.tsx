import { Link } from 'react-router-dom';
import { useApplicationId } from '@/hooks/useApplicationId';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, STATUS_LABEL } from '@/lib/utils';
import type { ApplicationDetail } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/status-badge';

export default function SiswaStatus() {
  const { appId, loading, error } = useApplicationId();

  const application = useQuery({
    queryKey: ['applications', appId],
    queryFn: () => api.get<ApplicationDetail>(`/pendaftaran/${appId}`),
    enabled: Boolean(appId),
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!appId) {
    return (
      <div>
        <PageHeader title="Status" description="Pilih pendaftaran untuk melihat status." />
        <EmptyState message="Belum ada pendaftaran yang dipilih." />
      </div>
    );
  }

  if (application.isLoading) return <LoadingState />;
  if (application.isError) return <ErrorState onRetry={() => application.refetch()} />;

  const detail = application.data!;

  return (
    <div>
      <PageHeader
        title="Status Pendaftaran"
        description={detail.application.registration_number}
        action={<StatusBadge status={detail.application.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Riwayat Status</h3>
            {detail.history.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada riwayat.</p>
            ) : (
              <div className="space-y-0">
                {[...detail.history].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50">
                        {h.new_status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-primary-700" />
                        )}
                      </div>
                      {i < detail.history.length - 1 && <div className="w-px flex-1 bg-slate-200" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-medium text-slate-800">
                        {STATUS_LABEL[h.new_status] ?? h.new_status}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(h.changed_at, true)}</p>
                      {h.note && (
                        <p className="mt-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                          Catatan: {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Catatan Verifikasi</h3>
            {detail.verifications.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada pemeriksaan dari panitia.</p>
            ) : (
              <div className="space-y-3">
                {[...detail.verifications].reverse().map((v) => (
                  <div key={v.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        {v.status === 'approved' ? 'Disetujui' : 'Perlu Perbaikan'}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(v.verified_at, true)}</span>
                    </div>
                    {v.note && <p className="mt-1 text-sm text-slate-600">{v.note}</p>}
                    {v.document_id && (
                      <p className="mt-1 text-xs text-slate-400">Terkait dokumen</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Link to={`/siswa/dokumen?app=${appId}`}>
          <span className="text-sm font-medium text-primary-700 hover:underline">Kelola dokumen →</span>
        </Link>
      </div>
    </div>
  );
}
