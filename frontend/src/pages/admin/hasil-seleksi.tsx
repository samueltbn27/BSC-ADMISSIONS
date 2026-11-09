import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ApplicantRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared/states';

export default function AdminHasilSeleksi() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ outcome: 'accepted', note: '', announcementAt: '' });

  const queue = useQuery({
    queryKey: ['selection-queue'],
    queryFn: () => api.get<{ applicants: ApplicantRow[] }>('/pendaftaran?status=selection_in_progress'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['selection-queue'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const save = useMutation({
    mutationFn: (body: any) => api.post('/hasil-seleksi', body),
    onSuccess: () => {
      toast.success('Hasil disimpan');
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const publish = useMutation({
    mutationFn: (applicationId: string) => api.post(`/hasil-seleksi/${applicationId}/publish`),
    onSuccess: () => {
      toast.success('Hasil dipublikasikan');
      setSelected(null);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (queue.isLoading) return <LoadingState />;
  if (queue.isError) return <ErrorState onRetry={() => queue.refetch()} />;

  const applicants = queue.data!.applicants;
  const target = selected ? applicants.find((a) => a.application_id === selected) : null;

  return (
    <div>
      <PageHeader
        title="Hasil Seleksi"
        description="Tetapkan dan publikasikan hasil seleksi untuk aplikasi yang berada dalam tahap seleksi."
      />

      {applicants.length === 0 ? (
        <EmptyState message="Belum ada aplikasi dalam tahap seleksi." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Nomor Pendaftaran</th>
                    <th className="px-4 py-3 font-medium">Dibuat</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => (
                    <tr key={a.application_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{a.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{a.registration_number}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelected(a.application_id!);
                            setForm({ outcome: 'accepted', note: '', announcementAt: '' });
                          }}
                        >
                          Tetapkan Hasil
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selected && target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSelected(null)} />
          <Card className="relative w-full max-w-lg">
            <CardContent className="p-6">
              <h3 className="mb-1 text-base font-semibold text-slate-900">Hasil Seleksi</h3>
              <p className="mb-4 text-sm text-slate-500">{target.full_name} · {target.registration_number}</p>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  save.mutate({
                    applicationId: selected,
                    outcome: form.outcome,
                    note: form.note || undefined,
                    announcementAt: new Date(form.announcementAt).toISOString(),
                  });
                }}
              >
                <div>
                  <Label htmlFor="outcome">Keputusan</Label>
                  <Select id="outcome" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}>
                    <option value="accepted">Diterima</option>
                    <option value="waitlisted">Cadangan</option>
                    <option value="rejected">Tidak Diterima</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="note">Keterangan</Label>
                  <Textarea id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="announcementAt">Jadwal Pengumuman</Label>
                  <Input id="announcementAt" type="datetime-local" value={form.announcementAt} onChange={(e) => setForm({ ...form, announcementAt: e.target.value })} required />
                </div>
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => setSelected(null)}>Batal</Button>
                  <Button type="submit" variant="secondary" loading={save.isPending}>
                    <Save className="h-4 w-4" /> Simpan Draft
                  </Button>
                  <Button
                    type="button"
                    loading={publish.isPending}
                    onClick={() => publish.mutate(selected)}
                  >
                    <Send className="h-4 w-4" /> Publikasikan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
