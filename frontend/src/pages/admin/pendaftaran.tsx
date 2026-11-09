import { StaffApplicantsList } from '@/components/shared/staff-applicants';
import { PageHeader } from '@/components/shared/states';

export default function AdminPendaftaran() {
  return (
    <div>
      <PageHeader title="Pendaftaran" description="Kelola seluruh pendaftaran calon siswa." />
      <StaffApplicantsList apiPath="/pendaftaran" detailPath="/admin/pendaftaran" />
    </div>
  );
}
