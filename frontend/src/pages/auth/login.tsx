import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (data) => {
        toast.success('Berhasil masuk');
        navigate(data.user.role === 'applicant' ? '/siswa/dashboard' : data.user.role === 'committee' ? '/panitia/dashboard' : '/admin/dashboard');
      },
      onError: (err) => toast.error(err.message),
    });
  });

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-900">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Masuk</h1>
        <p className="mt-1 text-sm text-slate-500">Akses dashboard pendaftaran Anda</p>
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
              <Input id="password" type="password" maxLength={128} autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" loading={login.isPending}>
              Masuk
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Belum punya akun?{' '}
            <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-primary-700 hover:underline">
              Daftar sebagai calon siswa
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
