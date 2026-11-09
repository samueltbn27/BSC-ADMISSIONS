import { useParams } from 'react-router-dom';
import { StaffDetail } from '@/components/shared/staff-detail';

export default function PanitiaDetail() {
  const { id } = useParams();
  return <StaffDetail id={id!} backPath="/panitia/pendaftaran" />;
}
