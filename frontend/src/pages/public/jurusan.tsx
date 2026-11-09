import { useQuery } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';
import type { Catalog } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/shared/states';

export default function Jurusan() {
  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get<Catalog>('/catalog'),
  });

  if (catalog.isLoading) return <LoadingState />;
  if (catalog.isError) return <ErrorState onRetry={() => catalog.refetch()} />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Program Keahlian</h1>
        <p className="mt-2 text-slate-500">Pilih program keahlian yang sesuai minat dan bakatmu</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {catalog.data!.majors.map((major) => (
          <Card key={major.id}>
            <CardContent className="flex gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                <GraduationCap className="h-6 w-6 text-primary-800" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-slate-900">{major.name}</h2>
                  <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-800">
                    {major.code}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{major.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
