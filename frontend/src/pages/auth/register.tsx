import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    email: z.string().trim().toLowerCase().email('Format email tidak valid'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    registerUser.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => {
          toast.success('Akun berhasil dibuat. Silakan masuk dengan email dan kata sandi Anda.');
          navigate('/login');
        },
        onError: (err) => toast.error(err.message),
      }
    );
  });

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-900">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Daftar Calon Siswa</h1>
        <p className="mt-1 text-sm text-slate-500">Buat akun untuk memulai pendaftaran</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" maxLength={254} placeholder="nama@email.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Kata Sandi</Label>
              <Input id="password" type="password" maxLength={128} autoComplete="new-password" placeholder="Minimal 8 karakter" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
              <Input id="confirmPassword" type="password" maxLength={128} autoComplete="new-password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" loading={registerUser.isPending}>
              Daftar
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-medium text-primary-700 hover:underline">
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
