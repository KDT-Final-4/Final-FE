import { getToken } from './auth';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

function joinUrl(base: string, path: string) {
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
  if (base.endsWith('/') && path.startsWith('/')) return `${base}${path.slice(1)}`;
  return `${base}${path}`;
}

async function request<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = joinUrl(API_BASE_URL, path);
  const headers = new Headers(init?.headers || {});
  const token = getToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers, credentials: 'include' });
  if (!res.ok) {
    let message = '';
    let body: any = null;
    const ct = res.headers.get('content-type') || '';
    // Treat any content-type containing 'json' as JSON (e.g., application/problem+json)
    if (ct.toLowerCase().includes('json')) {
      try {
        body = await res.json();
        message = body?.detail || body?.title || body?.message || '';
      } catch {
        // fallthrough to text
      }
    }
    if (!message) {
      const text = await res.text().catch(() => '');
      // If text looks like JSON, try parsing to extract detail/title/message
      if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
        try {
          const parsed = JSON.parse(text);
          body = parsed;
          message = parsed?.detail || parsed?.title || parsed?.message || '';
        } catch {
          // use raw text below
        }
      }
      if (!message) message = text || `HTTP ${res.status}`;
    }
    const err: any = new Error(message);
    err.status = res.status;
    if (!body && message && message !== `HTTP ${res.status}`) {
      // no structured body but we have a message; leave body undefined
    }
    if (body && typeof body === 'object') {
      err.code = body.type;
      err.body = body;
    }
    throw err;
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export const api = {
  get<T = unknown>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: 'GET' });
  },
  post<T = unknown>(path: string, body?: unknown, init?: RequestInit) {
    const headers = new Headers(init?.headers || {});
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return request<T>(path, {
      ...init,
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  put<T = unknown>(path: string, body?: unknown, init?: RequestInit) {
    const headers = new Headers(init?.headers || {});
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return request<T>(path, {
      ...init,
      method: 'PUT',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  patch<T = unknown>(path: string, body?: unknown, init?: RequestInit) {
    const headers = new Headers(init?.headers || {});
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return request<T>(path, {
      ...init,
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  del<T = unknown>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: 'DELETE' });
  },
};
