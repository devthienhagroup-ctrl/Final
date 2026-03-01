import { http } from "./http";

export type MeRes = {
  id: string;
  email?: string;
  role?: string;
  name?: string;
  phone?: string;
  birthDate?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
};

export type LoginReq = { email: string; password: string };
export type SendOtpReq = { email: string };
export type RegisterNewReq = {
  name?: string;
  phone: string;
  email: string;
  password: string;
  otp: string;
  acceptedPolicy: boolean;
  birthDate?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
};

export type UpdateProfileReq = {
  name?: string;
  phone?: string;
  birthDate?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
};

export type ChangePasswordReq = { currentPassword: string; newPassword: string };
export type ForgotPasswordReq = { email: string; newPassword: string };

export const authApi = {
  async me(): Promise<MeRes> {
    const { data } = await http.get("/auth/me");
    return data;
  },

  async login(payload: LoginReq) {
    const { data } = await http.post("/auth/login", payload);
    return data;
  },

  async sendOtp(payload: SendOtpReq) {
    const { data } = await http.post("/auth/send-otp", payload);
    return data;
  },

  async registerNew(payload: RegisterNewReq) {
    const { data } = await http.post("/auth/register-new", payload);
    return data;
  },

  async profile() {
    const { data } = await http.get("/auth/profile");
    return data;
  },

  async updateProfile(payload: UpdateProfileReq) {
    const { data } = await http.patch("/auth/profile", payload);
    return data;
  },

  async changePassword(payload: ChangePasswordReq) {
    const { data } = await http.post("/auth/change-password", payload);
    return data;
  },

  async forgotPassword(payload: ForgotPasswordReq) {
    const { data } = await http.post("/auth/forgot-password", payload);
    return data;
  },

  async logout() {
    const { data } = await http.post("/auth/logout");
    return data;
  },
};
