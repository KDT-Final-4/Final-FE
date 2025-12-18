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
  const response = await fetch(input, { credentials: init?.credentials ?? "include", ...init });
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Unauthorized");
  }
  return response;
}
