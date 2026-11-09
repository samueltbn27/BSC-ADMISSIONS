import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, STATUS_LABEL } from '@/lib/utils';
import type { ApplicantRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';

const FILTERABLE = Object.keys(STATUS_LABEL);

interface Props {
  apiPath: string;
  detailPath: string;
  defaultStatus?: string;
  statusOptions?: string[];
}

export function StaffApplicantsList({ apiPath, detailPath, defaultStatus, statusOptions = FILTERABLE }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>(defaultStatus ?? '');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const list = useQuery({
    queryKey: ['staff-applicants', q, status, page],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((page - 1) * pageSize) });
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      return api.get<{ applicants: ApplicantRow[]; total: number }>(`${apiPath}?${params.toString()}`);
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nama atau nomor pendaftaran..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-56"
        >
          <option value="">Semua status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </Select>
      </div>

      {list.isLoading ? (
        <LoadingState />
      ) : list.isError ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : list.data!.applicants.length === 0 ? (
        <EmptyState message="Tidak ada pendaftar yang cocok." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Nomor Pendaftaran</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Dibuat</th>
                    <th className="px-4 py-3 font-medium">Telepon</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.data!.applicants.map((a) => (
                    <tr key={a.user_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{a.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{a.registration_number ?? '-'}</td>
                      <td className="px-4 py-3">{a.status ? <StatusBadge status={a.status} /> : '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3 text-slate-600">{a.phone ?? '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!a.application_id}
                          onClick={() => navigate(`${detailPath}/${a.application_id}`)}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} pageSize={pageSize} total={list.data!.total} onPageChange={setPage} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
