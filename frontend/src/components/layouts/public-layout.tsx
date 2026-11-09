import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { GraduationCap, LogIn, Menu, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/profil-sekolah', label: 'Profil Sekolah' },
  { to: '/jurusan', label: 'Jurusan' },
  { to: '/alur-pendaftaran', label: 'Alur PPDB' },
  { to: '/jadwal', label: 'Jadwal' },
  { to: '/persyaratan', label: 'Persyaratan' },
  { to: '/pengumuman', label: 'Pengumuman' },
  { to: '/faq', label: 'FAQ' },
];

export function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-900">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-primary-900">SMK Bina Sarana Cendekia</p>
              <p className="text-xs text-slate-500">Penerimaan Murid Baru</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary-50 text-primary-900' : 'text-slate-600 hover:bg-slate-100'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4" /> Masuk
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    <UserPlus className="h-4 w-4" /> Daftar
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white px-4 pb-4 lg:hidden">
            <nav className="flex flex-col gap-1 pt-2">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-medium',
                      isActive ? 'bg-primary-50 text-primary-900' : 'text-slate-600'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
                {user ? (
                  <Link to="/dashboard" className="flex-1">
                    <Button className="w-full" size="sm">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">Masuk</Button>
                    </Link>
                    <Link to="/register" className="flex-1">
                      <Button className="w-full" size="sm">Daftar</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-bold text-primary-900">SMK Bina Sarana Cendekia</p>
              </div>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Sistem Penerimaan Murid Baru (PPDB) online untuk calon siswa baru.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <p className="font-medium text-slate-700">Tautan</p>
              <Link to="/jurusan" className="hover:text-primary-700">Program Keahlian</Link>
              <Link to="/alur-pendaftaran" className="hover:text-primary-700">Alur Pendaftaran</Link>
              <Link to="/jadwal" className="hover:text-primary-700">Jadwal PPDB</Link>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SMK Bina Sarana Cendekia. Seluruh hak cipta.
          </div>
        </div>
      </footer>
    </div>
  );
}
