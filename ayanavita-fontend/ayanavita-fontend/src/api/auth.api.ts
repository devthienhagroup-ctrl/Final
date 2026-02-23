// src/api/auth.api.ts
import { get, post, setAccessToken, clearAccessToken } from "./http";

export type AuthRole = "USER" | "ADMIN";

export type LoginReq = {
  email: string;
  password: string;
};

export type LoginRes = {
  accessToken: string;
};

export type RegisterReq = {
  email: string;
  password: string;
  name?: string;
};

export type RegisterRes = {
  id: number;
  email: string;
  role: AuthRole;
};

export type MeRes = {
  sub: number;
  email: string;
  role: AuthRole;
  iat?: number; // nếu backend trả
};

export const authApi = {
  /**
   * POST /auth/login
   * - auth: false
   * - tự lưu accessToken vào localStorage (qua http.ts)
   */
  async login(body: LoginReq) {
    const res = await post<LoginRes>("/auth/login", body, { auth: false });
    if (res?.accessToken) setAccessToken(res.accessToken);
    return res;
  },

  /**
   * POST /auth/register
   * - Nếu backend bạn chưa có endpoint này, gọi sẽ 404
   * - Không auto login (tuỳ bạn muốn)
   */
  register(body: RegisterReq) {
    return post<RegisterRes>("/auth/register", body, { auth: false });
  },

  /**
   * GET /auth/me
   * - auth: true (mặc định) nhưng viết rõ cho dễ đọc
   */
  me() {
    return get<MeRes>("/auth/me", { auth: true });
  },

  /**
   * Logout FE: xoá token phía client
   * (Backend không bắt buộc có endpoint)
   */
  logout() {
    clearAccessToken();
  },
};
