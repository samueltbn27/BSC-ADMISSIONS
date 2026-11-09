import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { AdminUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared/states';

const empty = { email: '', password: '', role: 'committee' as 'committee' | 'admin' };

export default function AdminPetugas() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(empty);

  const users = useQuery({
    queryKey: ['admin', 'petugas'],
    queryFn: () => api.get<{ users: AdminUser[] }>('/admin/petugas?role=committee'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'petugas'] });

  const create = useMutation({
    mutationFn: (body: typeof empty) => api.post('/admin/petugas', body),
    onSuccess: () => {
      toast.success('Petugas dibuat');
      setOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: (body: { id: string; accountStatus: string }) =>
      api.patch(`/admin/petugas/${body.id}`, { accountStatus: body.accountStatus }),
    onSuccess: () => {
      toast.success('Status akun diperbarui');
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (users.isLoading) return <LoadingState />;
  if (users.isError) return <ErrorState onRetry={() => users.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Petugas"
        description="Kelola akun panitia."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Petugas Baru
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.data!.users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.role_code === 'committee' ? 'Panitia' : 'Admin'}</td>
                    <td className="px-4 py-3">
                      <Badge className={u.account_status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                        {u.account_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatus.mutate({
                            id: u.id,
                            accountStatus: u.account_status === 'active' ? 'suspended' : 'active',
                          })
                        }
                      >
                        {u.account_status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
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
          <Card className="relative w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Petugas Baru</h3>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate(values);
                }}
              >
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="password">Kata Sandi Awal</Label>
                  <Input id="password" type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required minLength={8} />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select id="role" value={values.role} onChange={(e) => setValues({ ...values, role: e.target.value as any })}>
                    <option value="committee">Panitia</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button type="submit" loading={create.isPending}>Buat</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
