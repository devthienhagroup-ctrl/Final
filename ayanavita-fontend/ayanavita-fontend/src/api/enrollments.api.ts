// src/api/enrollments.api.ts
import { get, post } from "./http";

export type EnrollmentStatus = "ACTIVE" | "CANCELLED" | "PENDING";

export type MyCourse = {
  id: number; // enrollment id
  courseId: number;
  status: EnrollmentStatus;
  course: {
    id: number;
    title: string;
    thumbnail: string | null;
    price: number;
  };
};

export const enrollmentsApi = {
  /**
   * GET /me/courses
   * Trả danh sách khóa học user đã enroll (kèm status).
   */
  myCourses() {
    return get<MyCourse[]>("/me/courses", { auth: true });
  },

  /**
   * POST /courses/:id/cancel
   * Hủy enrollment (thường chuyển CANCELLED).
   */
  cancel(courseId: number) {
    return post<{ ok: boolean }>(`/courses/${courseId}/cancel`, {}, { auth: true });
  },

  /**
   * POST /courses/:id/order
   * Nếu backend của bạn endpoint này tạo order, nên ưu tiên gọi ordersApi.create(courseId)
   * để lấy đủ thông tin order (id, code, totals...). Hàm này giữ lại để backward-compatible.
   */
  order(courseId: number) {
    return post<{ ok: boolean }>(`/courses/${courseId}/order`, {}, { auth: true });
  },
};
