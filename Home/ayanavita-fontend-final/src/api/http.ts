import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8090";

export const http = axios.create({
  baseURL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("aya_access_token");
  if (token) {
    // axios v1 headers có thể là object hoặc AxiosHeaders -> normalize
    config.headers = (config.headers ?? {}) as any;
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});
