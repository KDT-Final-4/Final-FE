const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("isAuthenticated");
  } catch {
    // ignore storage errors
  }
  window.location.replace("/");
};

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // 문자열인 경우 getApiUrl을 사용하여 프로덕션 환경에서 올바른 백엔드 URL로 변환
  let url: RequestInfo | URL = input;
  if (typeof input === "string" && (input.startsWith("/api") || input.startsWith("api"))) {
    const { getApiUrl } = await import("./utils/api");
    url = getApiUrl(input);
  }
  
  const response = await fetch(url, { credentials: init?.credentials ?? "include", ...init });
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Unauthorized");
  }
  return response;
}
