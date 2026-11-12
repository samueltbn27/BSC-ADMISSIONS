const BASE = '/api/v1';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = body?.error;
    if (res.status === 401 && !path.startsWith('/auth/') && /^\/(siswa|panitia|admin)\//.test(window.location.pathname)) {
      const current = window.location.pathname;
      window.location.href = `/login?next=${encodeURIComponent(current)}`;
    }
    throw new ApiClientError(
      res.status,
      error?.code ?? 'ERROR',
      error?.message ?? 'Terjadi kesalahan'
    );
  }

  return (body?.data ?? undefined) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  async upload<T>(path: string, form: FormData): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const error = body?.error;
      throw new ApiClientError(
        res.status,
        error?.code ?? 'ERROR',
        error?.message ?? 'Terjadi kesalahan'
      );
    }
    return (body?.data ?? undefined) as T;
  },

  downloadUrl(path: string): string {
    return `${BASE}${path}`;
  },
};
