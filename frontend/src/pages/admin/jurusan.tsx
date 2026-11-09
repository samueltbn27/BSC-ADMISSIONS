import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Major } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorState, PageHeader } from '@/components/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';

type FormState = { open: boolean; editing: Major | null };

type FormValues = { code: string; name: string; description: string; is_active: boolean };

const empty: FormValues = { code: '', name: '', description: '', is_active: true };

export default function AdminJurusan() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({ open: false, editing: null });
  const [values, setValues] = useState(empty);

  const majors = useQuery({
    queryKey: ['admin', 'jurusan'],
    queryFn: () => api.get<{ majors: Major[] }>('/admin/jurusan'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'jurusan'] });

  const save = useMutation({
    mutationFn: (body: any) =>
      form.editing
        ? api.patch(`/admin/jurusan/${form.editing.id}`, body)
        : api.post('/admin/jurusan', body),
    onSuccess: () => {
      toast.success(form.editing ? 'Jurusan diperbarui' : 'Jurusan dibuat');
      setForm({ open: false, editing: null });
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (majors.isLoading) return <TableSkeleton />;
  if (majors.isError) return <ErrorState onRetry={() => majors.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Jurusan"
        description="Kelola program keahlian."
        action={
          <Button
            onClick={() => {
              setValues(empty);
              setForm({ open: true, editing: null });
            }}
          >
            <Plus className="h-4 w-4" /> Jurusan Baru
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Deskripsi</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {majors.data!.majors.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-primary-800">{m.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600">{m.description ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge className={m.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                        {m.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setValues({ code: m.code, name: m.name, description: m.description ?? '', is_active: m.is_active });
                          setForm({ open: true, editing: m });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setForm({ open: false, editing: null })} />
          <Card className="relative w-full max-w-lg">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                {form.editing ? 'Edit Jurusan' : 'Jurusan Baru'}
              </h3>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = form.editing
                    ? { name: values.name, description: values.description, isActive: values.is_active }
                    : values;
                  save.mutate(body);
                }}
              >
                <div>
                  <Label htmlFor="code">Kode</Label>
                  <Input id="code" value={values.code} disabled={Boolean(form.editing)} onChange={(e) => setValues({ ...values, code: e.target.value.toUpperCase() })} required />
                </div>
                <div>
                  <Label htmlFor="name">Nama</Label>
                  <Input id="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea id="description" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={values.is_active} onChange={(e) => setValues({ ...values, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary-600" />
                  Aktif (dapat dipilih pendaftar)
                </label>
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => setForm({ open: false, editing: null })}>Batal</Button>
                  <Button type="submit" loading={save.isPending}>Simpan</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
