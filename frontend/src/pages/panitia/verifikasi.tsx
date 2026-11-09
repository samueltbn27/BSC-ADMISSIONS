import { StaffApplicantsList } from '@/components/shared/staff-applicants';
import { PageHeader } from '@/components/shared/states';

export default function PanitiaVerifikasi() {
  return (
    <div>
      <PageHeader
        title="Verifikasi"
        description="Antrean pendaftaran yang dikirim dan sedang diperiksa."
      />
      <StaffApplicantsList
        apiPath="/pendaftaran"
        detailPath="/panitia/pendaftaran"
        defaultStatus="submitted"
        statusOptions={['submitted', 'under_review', 'correction_requested', 'verified']}
      />
    </div>
  );
}
