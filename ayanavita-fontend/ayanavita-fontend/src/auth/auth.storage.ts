const KEY = "AYANAVITA_ACCESS_TOKEN";

export function getToken() {
  return localStorage.getItem(KEY) || "";
}

export function setToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}
