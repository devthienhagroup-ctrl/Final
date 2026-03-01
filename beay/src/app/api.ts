const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8090").replace(/\/+$/, "");

function joinUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

type LoginResponse = {
  accessToken: string;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(joinUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || "Login failed");
  }

  if (!text) {
    throw new Error("Empty response from server");
  }

  return JSON.parse(text) as LoginResponse;
}
