import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <SearchX className="h-16 w-16 text-slate-300" />
      <h1 className="mt-4 text-3xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">Halaman yang Anda cari tidak ditemukan.</p>
      <Link to="/" className="mt-6">
        <Button>Kembali ke Beranda</Button>
      </Link>
    </div>
  );
}
