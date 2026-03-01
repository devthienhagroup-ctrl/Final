import { request } from "../../app/api";

export type DashboardStatsResponse = {
  rangeDays: number;
  kpis: {
    revenue: number;
    orders: number;
    students: number;
    completionRate: number;
    revenueChangePct: number;
    ordersChangePct: number;
  };
  lineChart: {
    labels: string[];
    revenue: number[];
    orders: number[];
  };
  topCourses: Array<{
    name: string;
    revenue: number;
    orders: number;
    trend: string;
  }>;
  recentOrders: Array<{
    code: string;
    student: string;
    course: string;
    total: number;
    status: "PAID" | "PENDING" | "CANCELED" | "EXPIRED";
    date: string;
  }>;
  studentProgress: Array<{
    name: string;
    course: string;
    progress: number;
  }>;
  revenueByPayment: Array<{
    method: "COD" | "SEPAY";
    revenue: number;
  }>;
  revenueByProductCategory: Array<{
    category: string;
    revenue: number;
  }>;
};

export const getDashboardStats = (rangeDays: number) => {}
  request<DashboardStatsResponse>(`/admin/dashboard/stats?range=${rangeDays}`);
