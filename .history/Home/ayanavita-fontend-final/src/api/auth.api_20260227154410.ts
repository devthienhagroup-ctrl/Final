import { http } from "./http";

export type MeRes = { id: string; email?: string; role?: string };

export type LoginReq = { email: string; password: string };
export type SendOtpReq = { email: string };
export type RegisterNewReq = {
  name?: string;
  phone: string;
  email: string;
  password: string;
  otp: string;
  acceptedPolicy: boolean;
};

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
};
