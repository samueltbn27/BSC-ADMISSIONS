import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Period } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorState, PageHeader } from '@/components/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';

const empty = { name: '', academic_year: '', opens_at: '', closes_at: '', is_active: false };

export default function AdminPeriode() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [values, setValues] = useState(empty);

  const periods = useQuery({
    queryKey: ['admin', 'periode'],
    queryFn: () => api.get<{ periods: Period[] }>('/admin/periode'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'periode'] });

  const save = useMutation({
    mutationFn: (body: any) =>
      editing ? api.patch(`/admin/periode/${editing.id}`, body) : api.post('/admin/periode', body),
    onSuccess: () => {
      toast.success(editing ? 'Periode diperbarui' : 'Periode dibuat');
      setOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (periods.isLoading) return <TableSkeleton />;
  if (periods.isError) return <ErrorState onRetry={() => periods.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Periode"
        description="Kelola gelombang penerimaan."
        action={
          <Button
            onClick={() => {
              setValues(empty);
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Periode Baru
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Tahun Ajaran</th>
                  <th className="px-4 py-3 font-medium">Dibuka</th>
                  <th className="px-4 py-3 font-medium">Ditutup</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {periods.data!.periods.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.academic_year}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(p.opens_at, true)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(p.closes_at, true)}</td>
                    <td className="px-4 py-3">
                      <Badge className={p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setValues({
                            name: p.name,
                            academic_year: p.academic_year,
                            opens_at: toLocalInput(p.opens_at),
                            closes_at: toLocalInput(p.closes_at),
                            is_active: p.is_active,
                          });
                          setEditing(p);
                          setOpen(true);
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <Card className="relative w-full max-w-lg">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                {editing ? 'Edit Periode' : 'Periode Baru'}
              </h3>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = {
                    name: values.name,
                    academicYear: values.academic_year,
                    opensAt: new Date(values.opens_at).toISOString(),
                    closesAt: new Date(values.closes_at).toISOString(),
                    isActive: values.is_active,
                  };
                  save.mutate(body);
                }}
              >
                <div>
                  <Label htmlFor="name">Nama Periode</Label>
                  <Input id="name" placeholder="Gelombang 1" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="year">Tahun Ajaran</Label>
                  <Input id="year" placeholder="2026/2027" value={values.academic_year} onChange={(e) => setValues({ ...values, academic_year: e.target.value })} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="opens">Dibuka</Label>
                    <Input id="opens" type="datetime-local" value={values.opens_at} onChange={(e) => setValues({ ...values, opens_at: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="closes">Ditutup</Label>
                    <Input id="closes" type="datetime-local" value={values.closes_at} onChange={(e) => setValues({ ...values, closes_at: e.target.value })} required />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={values.is_active} onChange={(e) => setValues({ ...values, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary-600" />
                  Aktifkan periode ini
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
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
