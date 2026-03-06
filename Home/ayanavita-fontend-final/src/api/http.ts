import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8090";
const ACCESS_TOKEN_KEY = "aya_access_token";
const REFRESH_TOKEN_KEY = "aya_refresh_token";

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const http = axios.create({
  baseURL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string | null> | null = null;

const refreshLog = (message: string, detail?: string | number) => {
  if (detail === undefined) {
    console.log(`[AUTH][FE] ${message}`);
    return;
  }
  console.log(`[AUTH][FE] ${message}: ${detail}`);
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    refreshLog("Refresh skipped (missing refresh token)");
    return null;
  }

  refreshLog("Calling /auth/refresh");

  try {
    const { data } = await refreshClient.post("/auth/refresh", undefined, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    const nextAccessToken = typeof data?.accessToken === "string" ? data.accessToken.trim() : "";
    const nextRefreshToken = typeof data?.refreshToken === "string" ? data.refreshToken.trim() : "";

    if (!nextAccessToken) {
      refreshLog("Refresh failed (missing accessToken in response)");
      return null;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
    refreshLog("Refresh success (access token updated)");

    if (nextRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
      refreshLog("Refresh success (refresh token rotated)");
    }

    return nextAccessToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      refreshLog("Refresh request failed", error.response?.status ?? "no-response");
    } else {
      refreshLog("Refresh request failed", "unknown-error");
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return null;
  }
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers = (config.headers ?? {}) as any;
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry || requestUrl.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshLog("401 detected, trying refresh flow", requestUrl || "unknown-url");

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const nextAccessToken = await refreshPromise;
    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers = (originalRequest.headers ?? {}) as any;
    (originalRequest.headers as any).Authorization = `Bearer ${nextAccessToken}`;
    refreshLog("Retrying request with refreshed access token", requestUrl || "unknown-url");

    return http(originalRequest);
  },
);
