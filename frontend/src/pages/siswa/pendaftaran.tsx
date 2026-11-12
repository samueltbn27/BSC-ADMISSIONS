import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ApplicationDetail, Catalog } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/status-badge';

export default function SiswaPendaftaran() {
  const { id } = useParams();

  if (id) return <Detail id={id} />;
  return <List />;
}

function List() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const applications = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: () => api.get<{ applications: ApplicationDetail['application'][] }>('/pendaftaran/me'),
  });

  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get<Catalog>('/catalog'),
  });

  const create = useMutation({
    mutationFn: (body: { periodId: string; majorId: number }) =>
      api.post<{ id: string }>('/pendaftaran', body),
    onSuccess: (data) => {
      toast.success('Draft pendaftaran dibuat');
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/siswa/pendaftaran/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const activePeriods = (catalog.data?.periods ?? []).filter(
    (p) => p.is_active && new Date(p.opens_at) <= new Date() && new Date(p.closes_at) > new Date()
  );
  const activeMajors = (catalog.data?.majors ?? []).filter((m) => m.is_active);

  if (applications.isLoading) return <LoadingState />;
  if (applications.isError) return <ErrorState onRetry={() => applications.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Pendaftaran"
        description="Buat dan kelola pendaftaran Anda."
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Pendaftaran Baru
          </Button>
        }
      />

      {applications.data!.applications.length === 0 ? (
        <EmptyState message="Belum ada pendaftaran." />
      ) : (
        <div className="space-y-3">
          {applications.data!.applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-medium text-slate-900">{app.registration_number}</p>
                  <p className="text-xs text-slate-500">Dibuat {formatDate(app.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={app.status} />
                  <Button variant="outline" size="sm" onClick={() => navigate(`/siswa/pendaftaran/${app.id}`)}>
                    Kelola
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowCreate(false)} />
          <Card className="relative w-full max-w-md">
            <CardHeader>
              <CardTitle>Pendaftaran Baru</CardTitle>
            </CardHeader>
            <CardContent>
              {activePeriods.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Belum ada periode pendaftaran aktif saat ini.
                </p>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    create.mutate({
                      periodId: String(fd.get('periodId')),
                      majorId: Number(fd.get('majorId')),
                    });
                  }}
                >
                  <div>
                    <Label htmlFor="periodId">Periode</Label>
                    <Select id="periodId" name="periodId" required defaultValue={activePeriods[0]?.id}>
                      {activePeriods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.academic_year}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="majorId">Jurusan</Label>
                    <Select id="majorId" name="majorId" required>
                      {activeMajors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.code})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
                    <Button type="submit" loading={create.isPending}>Buat Draft</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Detail({ id }: { id: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const application = useQuery({
    queryKey: ['applications', id],
    queryFn: () => api.get<ApplicationDetail>(`/pendaftaran/${id}`),
  });

  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get<Catalog>('/catalog'),
  });

  const mutable = useMutation({
    mutationFn: (body: { majorId?: number }) => api.patch(`/pendaftaran/${id}`, body ?? {}),
    onSuccess: () => {
      toast.success('Data pendaftaran diperbarui');
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
    },
    onError: (err) => toast.error(err.message),
  });

  const submit = useMutation({
    mutationFn: () => api.post(`/pendaftaran/${id}/submit`),
    onSuccess: () => {
      toast.success('Pendaftaran dikirim untuk diverifikasi');
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
    },
    onError: (err) => toast.error(err.message),
  });

  const withdraw = useMutation({
    mutationFn: () => api.post(`/pendaftaran/${id}/withdraw`),
    onSuccess: () => {
      toast.success('Pendaftaran ditarik');
      setWithdrawOpen(false);
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (application.isLoading) return <LoadingState />;
  if (application.isError) return <ErrorState onRetry={() => application.refetch()} />;

  const detail = application.data!;
  const editable = detail.application.status === 'draft' || detail.application.status === 'correction_requested';
  const activeMajors = (catalog.data?.majors ?? []).filter((m) => m.is_active);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/siswa/pendaftaran')}>
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Button>
      <PageHeader
        title={detail.application.registration_number}
        description={`Dibuat ${formatDate(detail.application.created_at)}`}
        action={<StatusBadge status={detail.application.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Periode & Jurusan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="majorId">Jurusan</Label>
              <Select
                id="majorId"
                defaultValue={detail.application.major_id}
                disabled={!editable}
                onChange={(e) => mutable.mutate({ majorId: Number(e.target.value) })}
              >
                {activeMajors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </Select>
            </div>
            {editable ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => submit.mutate()} loading={submit.isPending}>
                  Kirim Pendaftaran
                </Button>
                <Button variant="outline" onClick={() => setWithdrawOpen(true)}>
                  Tarik Pendaftaran
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Pendaftaran tidak dapat diubah pada status ini. Lihat halaman Status untuk riwayat.
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-medium text-slate-800">{detail.application.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Dikirim</p>
                <p className="font-medium text-slate-800">{formatDate(detail.application.submitted_at, true)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Aksi Lanjutan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs leading-5 text-slate-500">Pilihan jurusan disimpan sebagai draft. Lengkapi biodata dan dokumen wajib sebelum mengirim.</p>
            <Link to="/siswa/biodata" className="block"><Button variant="outline" className="w-full">Lengkapi Formulir Biodata</Button></Link>
            <Link to={`/siswa/dokumen?app=${id}`} className="block">
              <Button variant="secondary" className="w-full">Kelola Dokumen</Button>
            </Link>
            <Link to={`/siswa/status?app=${id}`} className="block">
              <Button variant="outline" className="w-full">Lihat Status & Riwayat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={withdrawOpen}
        title="Tarik pendaftaran ini?"
        description="Pendaftaran yang ditarik tidak dapat dikirim ulang."
        confirmLabel="Ya, tarik"
        danger
        loading={withdraw.isPending}
        onConfirm={() => withdraw.mutate()}
        onCancel={() => setWithdrawOpen(false)}
      />
    </div>
  );
}
