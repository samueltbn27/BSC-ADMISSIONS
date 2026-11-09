import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<AuthResponse>('/auth/me'),
    retry: false,
    staleTime: 30_000,
  });

  const setUser = (user: User) => {
    queryClient.setQueryData(['auth', 'me'], { user });
  };

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', body),
    onSuccess: (data) => setUser(data.user),
  });

  const register = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/register', body),
    onSuccess: (data) => setUser(data.user),
  });

  const logout = useMutation({
    mutationFn: () => api.post<{ logout: boolean }>('/auth/logout'),
    onSuccess: () => {
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
