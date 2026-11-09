import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layouts/public-layout';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { GuestRoute, HomeRedirect, ProtectedRoute, RoleRoute } from '@/routes/guards';

import Home from '@/pages/public/home';
import ProfilSekolah from '@/pages/public/profil-sekolah';
import Jurusan from '@/pages/public/jurusan';
import AlurPendaftaran from '@/pages/public/alur-pendaftaran';
import Jadwal from '@/pages/public/jadwal';
import Persyaratan from '@/pages/public/persyaratan';
import Pengumuman from '@/pages/public/pengumuman';
import Faq from '@/pages/public/faq';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import NotFound from '@/pages/not-found';

import SiswaDashboard from '@/pages/siswa/dashboard';
import SiswaBiodata from '@/pages/siswa/biodata';
import SiswaPendaftaran from '@/pages/siswa/pendaftaran';
import SiswaDokumen from '@/pages/siswa/dokumen';
import SiswaStatus from '@/pages/siswa/status';
import SiswaHasil from '@/pages/siswa/hasil';
import SiswaProfil from '@/pages/siswa/profil';

import PanitiaDashboard from '@/pages/panitia/dashboard';
import PanitiaPendaftaran from '@/pages/panitia/pendaftaran';
import PanitiaDetail from '@/pages/panitia/detail';
import PanitiaVerifikasi from '@/pages/panitia/verifikasi';
import PanitiaLaporan from '@/pages/panitia/laporan';

import AdminDashboard from '@/pages/admin/dashboard';
import AdminPendaftaran from '@/pages/admin/pendaftaran';
import AdminDetail from '@/pages/admin/detail';
import AdminJurusan from '@/pages/admin/jurusan';
import AdminPeriode from '@/pages/admin/periode';
import AdminPetugas from '@/pages/admin/petugas';
import AdminHasilSeleksi from '@/pages/admin/hasil-seleksi';
import AdminPengumuman from '@/pages/admin/pengumuman';
import AdminAuditLog from '@/pages/admin/audit-log';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profil-sekolah" element={<ProfilSekolah />} />
        <Route path="/jurusan" element={<Jurusan />} />
        <Route path="/alur-pendaftaran" element={<AlurPendaftaran />} />
        <Route path="/jadwal" element={<Jadwal />} />
        <Route path="/persyaratan" element={<Persyaratan />} />
        <Route path="/pengumuman" element={<Pengumuman />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/404" element={<NotFound />} />
      </Route>

      <Route path="/dashboard" element={<HomeRedirect />} />

      <Route
        path="/siswa"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['applicant']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SiswaDashboard />} />
        <Route path="biodata" element={<SiswaBiodata />} />
        <Route path="pendaftaran" element={<SiswaPendaftaran />} />
        <Route path="pendaftaran/:id" element={<SiswaPendaftaran />} />
        <Route path="dokumen" element={<SiswaDokumen />} />
        <Route path="status" element={<SiswaStatus />} />
        <Route path="hasil" element={<SiswaHasil />} />
        <Route path="profil" element={<SiswaProfil />} />
      </Route>

      <Route
        path="/panitia"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['committee', 'admin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PanitiaDashboard />} />
        <Route path="pendaftaran" element={<PanitiaPendaftaran />} />
        <Route path="pendaftaran/:id" element={<PanitiaDetail />} />
        <Route path="verifikasi" element={<PanitiaVerifikasi />} />
        <Route path="laporan" element={<PanitiaLaporan />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['admin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="pendaftaran" element={<AdminPendaftaran />} />
        <Route path="pendaftaran/:id" element={<AdminDetail />} />
        <Route path="jurusan" element={<AdminJurusan />} />
        <Route path="periode" element={<AdminPeriode />} />
        <Route path="petugas" element={<AdminPetugas />} />
        <Route path="hasil-seleksi" element={<AdminHasilSeleksi />} />
        <Route path="pengumuman" element={<AdminPengumuman />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
