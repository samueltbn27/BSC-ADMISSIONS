import { Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/states';

export default function SiswaProfil() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Profil Akun" description="Informasi akun pendaftaran Anda." />
      <Card className="max-w-2xl">
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
    </div>
  );
}
