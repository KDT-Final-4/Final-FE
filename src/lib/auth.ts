const TOKEN_KEY = 'auth_token';
const AUTH_FLAG_KEY = 'auth_flag';
const ACCESS_TOKEN_COOKIE_KEY = 'ACCESS_TOKEN';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
};

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split(';') : [];
  const match = cookies.map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.substring(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveToken(tokenFromResponse?: string | null): string | null {
  if (tokenFromResponse) return tokenFromResponse;
  return getCookieValue(ACCESS_TOKEN_COOKIE_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(TOKEN_KEY);
  if (stored) return stored;
  return getCookieValue(ACCESS_TOKEN_COOKIE_KEY);
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function setLoggedInFlag() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_FLAG_KEY, '1');
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(AUTH_FLAG_KEY);
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=; Max-Age=0; path=/`;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getToken() || window.localStorage.getItem(AUTH_FLAG_KEY) === '1';
}

export async function login(
  email: string,
  password: string,
  requestFn: <T>(path: string, body?: unknown) => Promise<T>,
  endpoint: string = '/auth/login',
) {
  const res = await requestFn<LoginResponse>(endpoint, { email, password });
  const token = resolveToken(res?.token ?? null);
  if (!token) throw new Error('Invalid login response');
  setToken(token);
}

export function logout() {
  clearToken();
}
