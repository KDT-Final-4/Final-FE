/**
 * API 호출 유틸리티
 * 프로덕션에서는 환경 변수로 설정된 백엔드 URL을 직접 사용하고,
 * 개발 환경에서는 Vite 프록시를 사용합니다.
 */

/**
 * API 엔드포인트를 생성합니다.
 * 프로덕션: 환경 변수의 백엔드 URL 직접 사용 (직접 연결)
 * 개발: 상대 경로 사용 (Vite 프록시)
 * 
 * @param path API 경로 (예: '/api/auth/login' 또는 '/api/user/me')
 * @returns 전체 API URL
 */
export function getApiUrl(path: string): string {
  // path가 이미 /api로 시작하는지 확인
  if (!path.startsWith('/api')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    path = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  // 프로덕션 환경에서는 백엔드 URL 직접 사용
  if (import.meta.env.PROD) {
    const backendUrl = import.meta.env.VITE_BACKEND_TARGET;
    if (backendUrl) {
      // 백엔드 URL이 있으면 직접 연결
      const baseUrl = backendUrl.endsWith('/') 
        ? backendUrl.slice(0, -1) 
        : backendUrl;
      const fullUrl = `${baseUrl}${path}`;
      console.log('[API] Using direct backend URL:', fullUrl);
      return fullUrl;
    } else {
      // 백엔드 URL이 설정되지 않은 경우 경고
      console.warn('[API] VITE_BACKEND_TARGET not set, using relative path:', path);
      return path;
    }
  }
  
  // 개발 환경: 상대 경로 사용 (Vite 프록시가 처리)
  console.log('[API] Using relative path (dev):', path);
  return path;
}

/**
 * API 요청을 위한 기본 옵션을 반환합니다.
 * credentials: 'include'를 기본으로 설정하여 쿠키/세션을 포함합니다.
 * 
 * @param options 추가 요청 옵션
 * @returns RequestInit 객체
 */
export function getApiOptions(options: RequestInit = {}): RequestInit {
  return {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
}

/**
 * API 요청을 수행하는 헬퍼 함수
 * 
 * @param path API 경로
 * @param options fetch 옵션
 * @returns Response 객체
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(path);
  const apiOptions = getApiOptions(options);
  
  return fetch(url, apiOptions);
}

