import { StaffApplicantsList } from '@/components/shared/staff-applicants';
import { PageHeader } from '@/components/shared/states';

export default function PanitiaPendaftaran() {
  return (
    <div>
      <PageHeader title="Pendaftaran" description="Cari dan kelola pendaftaran calon siswa." />
      <StaffApplicantsList apiPath="/pendaftaran" detailPath="/panitia/pendaftaran" />
    </div>
  );
}
