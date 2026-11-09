import { useQuery } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Announcement } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';

export default function Pengumuman() {
  const announcements = useQuery({
    queryKey: ['announcements', 'public'],
    queryFn: () => api.get<{ announcements: Announcement[] }>('/pengumuman/public'),
  });

  if (announcements.isLoading) return <LoadingState />;
  if (announcements.isError) return <ErrorState onRetry={() => announcements.refetch()} />;

  const list = announcements.data?.announcements ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Pengumuman</h1>
        <p className="mt-2 text-slate-500">Informasi resmi terkait PPDB</p>
      </div>

      {list.length === 0 ? (
        <EmptyState message="Belum ada pengumuman." />
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                    <Megaphone className="h-5 w-5 text-primary-800" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{item.title}</h2>
                    <p className="text-xs text-slate-500">Dipublikasikan {formatDate(item.published_at, true)}</p>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
