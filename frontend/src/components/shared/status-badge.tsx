import { Badge } from '@/components/ui/badge';
import { STATUS_COLOR, STATUS_LABEL, OUTCOME_LABEL } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_COLOR[status] ?? 'bg-slate-100 text-slate-700'}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const color =
    outcome === 'accepted'
      ? 'bg-emerald-100 text-emerald-800'
      : outcome === 'waitlisted'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';
  return <Badge className={color}>{OUTCOME_LABEL[outcome] ?? outcome}</Badge>;
}

export function DocStatusBadge({ status }: { status: string }) {
  const color =
    status === 'approved'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'correction_requested'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-800';
  const label = status === 'approved' ? 'Disetujui' : status === 'correction_requested' ? 'Perlu Perbaikan' : 'Menunggu';
  return <Badge className={color}>{label}</Badge>;
}
