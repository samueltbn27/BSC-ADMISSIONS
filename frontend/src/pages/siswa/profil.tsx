import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/states';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
    newPassword: z.string().min(8, 'Kata sandi baru minimal 8 karakter').max(128),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function SiswaProfil() {
  const { user, logout } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const changePassword = useMutation({
    mutationFn: (values: FormValues) =>
      api.post<{ changed: boolean; reauthenticate: boolean }>('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.success('Kata sandi diganti. Silakan masuk ulang.');
      reset();
      logout.mutate(undefined, {
        onSuccess: () => {
          window.location.href = '/login';
        },
      });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      <PageHeader title="Profil Akun" description="Informasi akun dan keamanan." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-900 text-lg font-bold text-white">
                {user?.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{user?.email}</p>
                <p className="text-sm text-slate-500">Calon Siswa</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-800">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="text-sm font-medium text-slate-800">Calon Siswa</p>
                </div>
              </div>
            </div>
            <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
              Email digunakan untuk masuk ke sistem. Jangan berikan kata sandi kepada siapa pun.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Ganti Kata Sandi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSubmit((values) => changePassword.mutate(values))}
            >
              <div>
                <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                <Input id="currentPassword" type="password" {...register('currentPassword')} />
                {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>}
              </div>
              <div>
                <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                <Input id="newPassword" type="password" placeholder="Minimal 8 karakter" {...register('newPassword')} />
                {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button type="submit" loading={changePassword.isPending}>Ganti Kata Sandi</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
