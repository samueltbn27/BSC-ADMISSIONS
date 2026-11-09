import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Announcement } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState, ErrorState, PageHeader } from '@/components/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';

const empty = { title: '', body: '', publish: false };

export default function AdminPengumuman() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [values, setValues] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'pengumuman'],
    queryFn: () => api.get<{ announcements: Announcement[] }>('/admin/pengumuman'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'pengumuman'] });

  const save = useMutation({
    mutationFn: (body: any) =>
      editing ? api.patch(`/admin/pengumuman/${editing.id}`, body) : api.post('/admin/pengumuman', body),
    onSuccess: () => {
      toast.success(editing ? 'Pengumuman diperbarui' : 'Pengumuman dibuat');
      setOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/admin/pengumuman/${id}`),
    onSuccess: () => {
      toast.success('Pengumuman dihapus');
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (list.isLoading) return <TableSkeleton />;
  if (list.isError) return <ErrorState onRetry={() => list.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Pengumuman"
        description="Kelola pengumuman publik."
        action={
          <Button
            onClick={() => {
              setValues(empty);
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Pengumuman Baru
          </Button>
        }
      />

      {list.data!.announcements.length === 0 ? (
        <EmptyState message="Belum ada pengumuman." />
      ) : (
        <div className="space-y-4">
          {list.data!.announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-slate-900">{a.title}</h3>
                    <Badge className={a.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                      {a.is_published ? 'Terbit' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.body}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {a.published_at ? `Terbit ${formatDate(a.published_at, true)}` : `Diperbarui ${formatDate(a.updated_at, true)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setValues({ title: a.title, body: a.body, publish: a.is_published });
                      setEditing(a);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(a)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <Card className="relative w-full max-w-lg">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                {editing ? 'Edit Pengumuman' : 'Pengumuman Baru'}
              </h3>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  save.mutate(values);
                }}
              >
                <div>
                  <Label htmlFor="title">Judul</Label>
                  <Input id="title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="body">Isi</Label>
                  <Textarea id="body" value={values.body} onChange={(e) => setValues({ ...values, body: e.target.value })} required />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={values.publish} onChange={(e) => setValues({ ...values, publish: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary-600" />
                  Publikasikan sekarang
                </label>
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button type="submit" loading={save.isPending}>Simpan</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus pengumuman?"
        description="Tindakan ini permanen."
        confirmLabel="Ya, hapus"
        danger
        loading={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
