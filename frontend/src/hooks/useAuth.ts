import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiClientError } from '@/lib/api';
import type { User } from '@/types';

interface AuthResponse {
  user: User;
}

let cache: { user: User | null } | null = null;
let inflight: Promise<{ user: User | null }> | null = null;

async function fetchMe(): Promise<{ user: User | null }> {
  if (cache) return cache;
  if (!inflight) {
    inflight = api
      .get<AuthResponse>('/auth/me')
      .then((res) => {
        cache = { user: res.user };
        return cache;
      })
      .catch((err) => {
        if (err instanceof ApiClientError && err.status === 401) {
          cache = { user: null };
          return cache;
        }
        throw err;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

function setCachedUser(user: User | null) {
  cache = { user };
}

export function useAuth() {
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', body),
    onSuccess: (data) => {
      setCachedUser(data.user);
      queryClient.setQueryData(['auth', 'me'], { user: data.user });
    },
  });

  const register = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/register', body),
    onSuccess: (data) => {
      setCachedUser(data.user);
      queryClient.setQueryData(['auth', 'me'], { user: data.user });
    },
  });

  const logout = useMutation({
    mutationFn: () => api.post<{ logout: boolean }>('/auth/logout'),
    onSuccess: () => {
      setCachedUser(null);
      queryClient.clear();
    },
  });

  return {
    user: me.data?.user ?? null,
    isLoading: me.isLoading,
    isAuthenticated: Boolean(me.data?.user),
    login,
    register,
    logout,
  };
}
