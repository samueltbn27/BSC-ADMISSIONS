import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared/states';

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const schema = z.object({
  fullName: z.string().trim().min(1, 'Nama wajib diisi').max(150),
  birthplace: z.preprocess(emptyToNull, z.string().trim().min(1).max(100).nullable()),
  birthDate: z.preprocess(emptyToNull, z.string().nullable()),
  gender: z.preprocess(emptyToNull, z.enum(['L', 'P']).nullable()),
  address: z.preprocess(emptyToNull, z.string().trim().min(1).max(1000).nullable()),
  phone: z.preprocess(
    emptyToNull,
    z.string().regex(/^\+[1-9][0-9]{7,14}$/, 'Gunakan format E.164, mis. +6281234567890').nullable()
  ),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export default function SiswaBiodata() {
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<{ profile: Profile | null }>('/siswa/profil'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (profile.data?.profile) {
      const p = profile.data.profile;
      reset({
        fullName: p.full_name ?? '',
        birthplace: p.birthplace ?? '',
        birthDate: p.birth_date ?? '',
        gender: (p.gender ?? '') as 'L' | 'P' | '',
        address: p.address ?? '',
        phone: p.phone ?? '',
      });
    }
  }, [profile.data, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      api.put<{ profileId: string }>('/siswa/profil', values),
    onSuccess: () => {
      toast.success('Biodata disimpan');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (profile.isLoading) return <LoadingState />;
  if (profile.isError) return <ErrorState onRetry={() => profile.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Biodata"
        description="Data diri calon siswa. Semua field wajib diisi sebelum mengirim pendaftaran."
      />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Formulir Biodata</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => save.mutate(values))} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input id="fullName" autoComplete="name" maxLength={150} placeholder="Nama sintetis untuk demo" {...register('fullName')} />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="birthplace">Tempat Lahir</Label>
                <Input id="birthplace" {...register('birthplace')} />
                {errors.birthplace && <p className="mt-1 text-xs text-red-600">{errors.birthplace.message}</p>}
              </div>
              <div>
                <Label htmlFor="birthDate">Tanggal Lahir</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
                {errors.birthDate && <p className="mt-1 text-xs text-red-600">{errors.birthDate.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <Select id="gender" {...register('gender')}>
                <option value="">Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </Select>
              {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>}
            </div>
            <div>
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea id="address" placeholder="Alamat sesuai kartu keluarga" {...register('address')} />
              {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input id="phone" type="tel" autoComplete="tel" placeholder="+6280000000000" {...register('phone')} />
              <p className="mt-1 text-xs text-slate-400">Format internasional dimulai dengan +62</p>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" loading={save.isPending}>Simpan Draft Biodata</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
