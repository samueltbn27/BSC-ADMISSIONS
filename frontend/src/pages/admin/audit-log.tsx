import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { AuditLogRow } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ErrorState, PageHeader } from '@/components/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Pagination } from '@/components/shared/pagination';

const ACTION_LABEL: Record<string, string> = {
  account_created: 'Akun dibuat',
  account_updated: 'Akun diperbarui',
  profile_saved: 'Biodata disimpan',
  application_created: 'Pendaftaran dibuat',
  major_changed: 'Jurusan diganti',
  status_changed: 'Status berubah',
  document_uploaded: 'Dokumen diunggah',
  document_verified: 'Dokumen diverifikasi',
  application_verified: 'Aplikasi diverifikasi',
  result_saved: 'Hasil disimpan',
  result_published: 'Hasil dipublikasikan',
  password_changed: 'Kata sandi diganti',
  period_created: 'Periode dibuat',
  period_updated: 'Periode diperbarui',
  major_created: 'Jurusan dibuat',
  major_updated: 'Jurusan diperbarui',
  announcement_created: 'Pengumuman dibuat',
  announcement_updated: 'Pengumuman diperbarui',
  announcement_deleted: 'Pengumuman dihapus',
};

export default function AdminAuditLog() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const logs = useQuery({
    queryKey: ['admin', 'audit-log', page],
    queryFn: () =>
      api.get<{ logs: AuditLogRow[]; total: number }>(
        `/admin/audit-log?limit=${pageSize}&offset=${(page - 1) * pageSize}`
      ),
  });

  if (logs.isLoading) return <TableSkeleton />;
  if (logs.isError) return <ErrorState onRetry={() => logs.refetch()} />;

  return (
    <div>
      <PageHeader title="Audit Log" description="Riwayat aktivitas penting sistem." />

      {logs.data!.logs.length === 0 ? (
        <EmptyState message="Belum ada aktivitas." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-4 py-3 font-medium">Waktu</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                    <th className="px-4 py-3 font-medium">Entitas</th>
                    <th className="px-4 py-3 font-medium">ID Target</th>
                    <th className="px-4 py-3 font-medium">Aktor</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.data!.logs.map((l) => (
                    <tr key={`${l.occurred_at}-${l.entity_id}`} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-600">{formatDate(l.occurred_at, true)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{ACTION_LABEL[l.action] ?? l.action}</td>
                      <td className="px-4 py-3 text-slate-600">{l.entity_type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.entity_id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.actor_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} pageSize={pageSize} total={logs.data!.total} onPageChange={setPage} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
