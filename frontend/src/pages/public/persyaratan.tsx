import { useQuery } from '@tanstack/react-query';
import { FileText, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import type { Catalog } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorState, LoadingState } from '@/components/shared/states';

export default function Persyaratan() {
  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get<Catalog>('/catalog'),
  });

  if (catalog.isLoading) return <LoadingState />;
  if (catalog.isError) return <ErrorState onRetry={() => catalog.refetch()} />;

  const types = catalog.data!.document_types;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Persyaratan Pendaftaran</h1>
        <p className="mt-2 text-slate-500">Dokumen yang wajib dan opsional selama pendaftaran</p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Dokumen diunggah dalam format <strong>PDF, JPG, atau PNG</strong>. Pastikan berkas terbaca jelas
          dan ukurannya sesuai ketentuan. Dokumen dapat diganti sebelum diverifikasi panitia.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {types.map((type) => (
          <Card key={type.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                    <FileText className="h-5 w-5 text-primary-800" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{type.name}</h2>
                    <p className="text-xs text-slate-500">Batas {formatBytes(type.max_size_bytes)}</p>
                  </div>
                </div>
                <Badge className={type.is_required ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}>
                  {type.is_required ? 'Wajib' : 'Opsional'}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {type.allowed_mime_types.map((m) => (
                  <span key={m} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {m === 'application/pdf' ? 'PDF' : m === 'image/jpeg' ? 'JPG' : 'PNG'}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
