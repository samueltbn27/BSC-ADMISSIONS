import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ApplicationSummary } from '@/types';

export function useApplicationId() {
  const [params] = useSearchParams();
  const explicit = params.get('app');
  const list = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: () => api.get<{ applications: ApplicationSummary[] }>('/pendaftaran/me'),
    enabled: !explicit,
  });
  return { appId: explicit ?? list.data?.applications[0]?.id ?? null, loading: !explicit && list.isLoading, error: list.isError };
}
