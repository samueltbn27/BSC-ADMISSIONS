import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: Record<Role, NavItem[]> = {
  applicant: [
    { to: '/siswa/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/siswa/biodata', label: 'Biodata', icon: User },
    { to: '/siswa/pendaftaran', label: 'Pendaftaran', icon: LayoutDashboard },
    { to: '/siswa/dokumen', label: 'Dokumen', icon: LayoutDashboard },
    { to: '/siswa/status', label: 'Status', icon: LayoutDashboard },
    { to: '/siswa/hasil', label: 'Hasil Seleksi', icon: LayoutDashboard },
    { to: '/siswa/profil', label: 'Profil Akun', icon: User },
  ],
  committee: [
    { to: '/panitia/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/panitia/pendaftaran', label: 'Pendaftaran', icon: LayoutDashboard },
    { to: '/panitia/verifikasi', label: 'Verifikasi', icon: LayoutDashboard },
    { to: '/panitia/laporan', label: 'Laporan', icon: LayoutDashboard },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/pendaftaran', label: 'Pendaftaran', icon: LayoutDashboard },
    { to: '/admin/jurusan', label: 'Jurusan', icon: LayoutDashboard },
    { to: '/admin/periode', label: 'Periode', icon: LayoutDashboard },
    { to: '/admin/petugas', label: 'Petugas', icon: User },
    { to: '/admin/hasil-seleksi', label: 'Hasil Seleksi', icon: LayoutDashboard },
    { to: '/admin/pengumuman', label: 'Pengumuman', icon: LayoutDashboard },
    { to: '/admin/audit-log', label: 'Audit Log', icon: LayoutDashboard },
  ],
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!user) return null;
  const items = NAV[user.role] ?? [];
  const roleLabel =
    user.role === 'applicant' ? 'Calon Siswa' : user.role === 'committee' ? 'Panitia' : 'Admin';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">BSC Admissions</p>
          <p className="text-xs text-slate-400">{roleLabel}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{user.email}</p>
            <p className="text-[11px] text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setConfirmLogout(true)}>
          <LogOut className="h-4 w-4" /> Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-900 lg:block">{sidebar}</aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <p className="hidden text-sm text-slate-500 lg:block">
            {items.find((i) => location.pathname.startsWith(i.to))?.label ?? 'Dashboard'}
          </p>
          <Link to="/" className="text-sm font-medium text-primary-800 hover:underline">
            Lihat situs
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Keluar dari akun?"
        description="Anda akan diarahkan ke halaman beranda."
        confirmLabel="Ya, keluar"
        danger
        loading={logout.isPending}
        onConfirm={() => {
          logout.mutate(undefined, {
            onSuccess: () => {
              window.location.href = '/';
            },
          });
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
