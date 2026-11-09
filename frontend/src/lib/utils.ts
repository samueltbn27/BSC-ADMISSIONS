import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '-';
  const d = new Date(value);
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Dikirim',
  under_review: 'Sedang Diperiksa',
  correction_requested: 'Perlu Perbaikan',
  verified: 'Terverifikasi',
  selection_in_progress: 'Dalam Seleksi',
  completed: 'Selesai',
  withdrawn: 'Ditarik',
};

export const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  correction_requested: 'bg-red-100 text-red-800',
  verified: 'bg-emerald-100 text-emerald-800',
  selection_in_progress: 'bg-violet-100 text-violet-800',
  completed: 'bg-green-100 text-green-800',
  withdrawn: 'bg-slate-200 text-slate-600',
};

export const OUTCOME_LABEL: Record<string, string> = {
  accepted: 'Diterima',
  waitlisted: 'Cadangan',
  rejected: 'Tidak Diterima',
};
