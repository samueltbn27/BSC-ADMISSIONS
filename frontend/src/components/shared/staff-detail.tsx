import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatBytes, formatDate, STATUS_LABEL } from '@/lib/utils';
import type { ApplicationDetail, Catalog } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { DocStatusBadge, StatusBadge } from '@/components/shared/status-badge';

interface Props {
  id: string;
  backPath: string;
}

export function StaffDetail({ id, backPath }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: () => api.get<Catalog>('/catalog') });

  const application = useQuery({
    queryKey: ['staff-application', id],
    queryFn: () => api.get<ApplicationDetail>(`/pendaftaran/${id}`),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['staff-application', id] });
    queryClient.invalidateQueries({ queryKey: ['staff-applicants'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const transition = useMutation({
    mutationFn: (body: { status: string; note?: string }) =>
      api.post(`/pendaftaran/${id}/status`, body),
    onSuccess: () => {
      toast.success('Status diperbarui');
      setNote('');
      setPendingAction(null);
      invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  const verifyDoc = useMutation({
    mutationFn: (body: { documentId: string; status: string; note?: string }) =>
      api.post(`/verifikasi/dokumen/${body.documentId}`, {
        status: body.status,
        note: body.note,
      }),
    onSuccess: () => {
      toast.success('Dokumen diverifikasi');
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (application.isLoading) return <LoadingState />;
  if (application.isError) return <ErrorState onRetry={() => application.refetch()} />;

  const detail = application.data!;
  const app = detail.application;

  const docAction = (docId: string, status: 'approved' | 'correction_requested') => {
    if (status === 'correction_requested' && !note.trim()) {
      toast.error('Catatan perbaikan wajib diisi');
      return;
    }
    verifyDoc.mutate({ documentId: docId, status, note: status === 'correction_requested' ? note : undefined });
  };

  const transitions: Record<string, { label: string; status: string; requiresNote?: boolean }[]> = {
    submitted: [{ label: 'Mulai Periksa', status: 'under_review' }],
    under_review: [
      { label: 'Setujui & Verifikasi', status: 'verified' },
      { label: 'Minta Perbaikan', status: 'correction_requested', requiresNote: true },
    ],
    verified: [{ label: 'Masukkan Seleksi', status: 'selection_in_progress' }],
  };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(backPath)}>
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{detail.profile.full_name ?? '-'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {app.registration_number} · dibuat {formatDate(app.created_at)}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Biodata</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Nama Lengkap</p>
              <p className="font-medium text-slate-800">{detail.profile.full_name ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tempat Lahir</p>
              <p className="font-medium text-slate-800">{detail.profile.birthplace ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tanggal Lahir</p>
              <p className="font-medium text-slate-800">{formatDate(detail.profile.birth_date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Jenis Kelamin</p>
              <p className="font-medium text-slate-800">
                {detail.profile.gender === 'L' ? 'Laki-laki' : detail.profile.gender === 'P' ? 'Perempuan' : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Telepon</p>
              <p className="font-medium text-slate-800">{detail.profile.phone ?? '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Alamat</p>
              <p className="font-medium text-slate-800">{detail.profile.address ?? '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catatan & Tindakan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(transitions[app.status] ?? []).map((t) => (
              <div key={t.status} className="rounded-lg border border-slate-200 p-3">
                {t.requiresNote && (
                  <div className="mb-3">
                    <Label htmlFor="note">Catatan perbaikan (wajib)</Label>
                    <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Jelaskan apa yang perlu diperbaiki" />
                  </div>
                )}
                <Button
                  className="w-full"
                  variant={t.status === 'correction_requested' ? 'danger' : 'primary'}
                  onClick={() => {
                    if (t.requiresNote) {
                      if (!note.trim()) {
                        toast.error('Catatan perbaikan wajib diisi');
                        return;
                      }
                      setPendingAction(t.status);
                    } else {
                      setPendingAction(t.status);
                    }
                  }}
                >
                  {t.label}
                </Button>
              </div>
            ))}
            {!transitions[app.status]?.length && (
              <p className="text-sm text-slate-500">
                Tidak ada transisi yang tersedia pada status {STATUS_LABEL[app.status]}.
              </p>
            )}
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Riwayat status</p>
              <div className="space-y-1.5">
                {detail.history.slice(-5).map((h, i) => (
                  <p key={i} className="text-xs text-slate-600">
                    <span className="font-medium">{STATUS_LABEL[h.new_status] ?? h.new_status}</span>
                    {' · '}{formatDate(h.changed_at, true)}
                    {h.note ? ` — ${h.note}` : ''}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader><CardTitle>Dokumen</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {detail.documents.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada dokumen diunggah.</p>
          ) : (
            detail.documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-slate-900">{catalog.data?.document_types.find((t) => t.id === doc.document_type_id)?.name ?? `Dokumen #${doc.document_type_id}`}</p>
                    <DocStatusBadge status={doc.verification_status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.mime_type} · {formatBytes(doc.size_bytes)} · revisi {doc.revision} · {formatDate(doc.uploaded_at, true)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={api.downloadUrl(`/dokumen/${doc.id}/download`)} download>
                    <Button variant="outline" size="sm">Unduh</Button>
                  </a>
                  {app.status === 'under_review' && (
                    <>
                      <Button size="sm" onClick={() => docAction(doc.id, 'approved')} loading={verifyDoc.isPending}>
                        <CheckCircle2 className="h-4 w-4" /> Setujui
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => docAction(doc.id, 'correction_requested')}>
                        Minta Perbaikan
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction === 'correction_requested' ? 'Minta perbaikan?' : 'Lanjutkan transisi status?'}
        description={
          pendingAction === 'correction_requested'
            ? 'Calon siswa akan menerima catatan perbaikan dan dapat mengunggah ulang dokumen.'
            : `Status akan diubah menjadi ${pendingAction ? STATUS_LABEL[pendingAction] : ''}.`
        }
        confirmLabel="Ya, lanjutkan"
        danger={pendingAction === 'correction_requested'}
        loading={transition.isPending}
        onConfirm={() => {
          if (pendingAction) transition.mutate({ status: pendingAction, note: note || undefined });
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
