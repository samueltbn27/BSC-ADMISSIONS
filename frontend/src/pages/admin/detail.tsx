import { useParams } from 'react-router-dom';
import { StaffDetail } from '@/components/shared/staff-detail';

export default function AdminDetail() {
  const { id } = useParams();
  return <StaffDetail id={id!} backPath="/admin/pendaftaran" />;
}
