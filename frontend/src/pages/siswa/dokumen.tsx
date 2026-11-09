import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';
import type { ApplicationDetail, Catalog } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared/states';
import { DocStatusBadge, StatusBadge } from '@/components/shared/status-badge';

export default function SiswaDokumen() {
  const [params] = useSearchParams();
  const appId = params.get('app');
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<number | null>(null);

  const application = useQuery({
    queryKey: ['applications', appId],
    queryFn: () => api.get<ApplicationDetail>(`/pendaftaran/${appId}`),
    enabled: Boolean(appId),
  });

  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get<Catalog>('/catalog'),
  });

  const upload = useMutation({
    mutationFn: ({ applicationId, documentTypeId, file }: { applicationId: string; documentTypeId: number; file: File }) => {
      const form = new FormData();
      form.append('applicationId', applicationId);
      form.append('documentTypeId', String(documentTypeId));
      form.append('file', file);
      return api.upload<{ id: string }>('/dokumen', form);
    },
    onSuccess: () => {
      toast.success('Dokumen diunggah');
      queryClient.invalidateQueries({ queryKey: ['applications', appId] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!appId) {
    return (
      <div>
        <PageHeader title="Dokumen" description="Pilih pendaftaran untuk mengelola dokumen." />
        <EmptyState message="Belum ada pendaftaran yang dipilih." />
      </div>
    );
  }

  if (application.isLoading || catalog.isLoading) return <LoadingState />;
  if (application.isError || catalog.isError) return <ErrorState onRetry={() => application.refetch()} />;

  const detail = application.data!;
  const editable = detail.application.status === 'draft' || detail.application.status === 'correction_requested';
  const types = catalog.data!.document_types;

  const handleFile = (typeId: number) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploadingType(typeId);
    upload.mutate(
      { applicationId: appId!, documentTypeId: typeId, file },
      {
        onSettled: () => {
          setUploadingType(null);
          if (fileRef.current) fileRef.current.value = '';
        },
      }
    );
  };

  return (
    <div>
      <PageHeader
        title="Dokumen"
        description={`Pendaftaran ${detail.application.registration_number}`}
        action={<StatusBadge status={detail.application.status} />}
      />

      {!editable && (
        <p className="mb-4 text-sm text-slate-500">
          Dokumen tidak dapat diubah pada status ini.
        </p>
      )}

      <div className="space-y-4">
        {types.map((type) => {
          const doc = detail.documents.find((d) => d.document_type_id === type.id);
          return (
            <Card key={type.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-slate-900">{type.name}</h3>
                    {doc ? <DocStatusBadge status={doc.verification_status} /> : <span className="text-xs text-slate-400">Belum diunggah</span>}
                  </div>
                  {doc && (
                    <p className="mt-1 text-xs text-slate-500">
                      {formatBytes(doc.size_bytes)} · revisi {doc.revision} · {formatDate(doc.uploaded_at, true)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {doc && (
                    <a href={api.downloadUrl(`/dokumen/${doc.id}/download`)} download>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" /> Unduh
                      </Button>
                    </a>
                  )}
                  {editable && (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept={type.allowed_mime_types.join(',')}
                        className="hidden"
                        onChange={() => handleFile(type.id)}
                      />
                      <Button size="sm" onClick={() => fileRef.current?.click()} loading={uploadingType === type.id}>
                        <Upload className="h-4 w-4" /> {doc ? 'Ganti' : 'Unggah'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        {editable && (
          <Link to={`/siswa/pendaftaran/${appId}`}>
            <Button variant="secondary">Kembali ke Pendaftaran</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
