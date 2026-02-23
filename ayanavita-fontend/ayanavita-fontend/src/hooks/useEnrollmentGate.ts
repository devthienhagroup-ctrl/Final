// src/hooks/useEnrollmentGate.ts
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { enrollmentsApi, type MyCourse } from "../api/enrollments.api";

/**
 * Gate status (FE)
 * - NOT_ENROLLED: không có record enrollment cho courseId này trong /me/courses
 * - UNKNOWN: có record nhưng status lạ / mismatch
 */
export type EnrollmentGateStatus =
  | "ACTIVE"
  | "PENDING"
  | "CANCELLED"
  | "NOT_ENROLLED"
  | "UNKNOWN";

export type EnrollmentGateState = {
  courseId: number;
  status: EnrollmentGateStatus;
  canAccess: boolean; // true => nên gọi lessons/progress/lesson detail gated
  reason?: string;
  loading: boolean;
  error?: string | null;
  enrollment?: MyCourse | null;
  refresh: () => Promise<void>;
};

type StoreSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  byCourseId: Map<number, MyCourse>;
};

const store = (() => {
  let snap: StoreSnapshot = {
    status: "idle",
    error: null,
    byCourseId: new Map<number, MyCourse>(),
  };

  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((fn) => fn());

  const setSnap = (next: Partial<StoreSnapshot>) => {
    snap = { ...snap, ...next };
    notify();
  };

  const getSnapshot = () => snap;

  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };

  let inflight: Promise<void> | null = null;

  const fetchMyCourses = async () => {
    if (inflight) return inflight;

    inflight = (async () => {
      setSnap({ status: "loading", error: null });
      try {
        const list = await enrollmentsApi.myCourses();
        const map = new Map<number, MyCourse>();
        for (const e of list || []) {
          map.set(Number(e.courseId), e);
        }
        setSnap({ status: "ready", byCourseId: map, error: null });
      } catch (e: any) {
        setSnap({
          status: "error",
          error: e?.message || "Không tải được enrollment.",
          byCourseId: new Map<number, MyCourse>(),
        });
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  };

  const ensureLoaded = async () => {
    if (snap.status === "idle") await fetchMyCourses();
  };

  return { subscribe, getSnapshot, fetchMyCourses, ensureLoaded };
})();

function normalizeStatus(enroll?: MyCourse | null): EnrollmentGateStatus {
  if (!enroll) return "NOT_ENROLLED";
  if (enroll.status === "ACTIVE") return "ACTIVE";
  if (enroll.status === "PENDING") return "PENDING";
  if (enroll.status === "CANCELLED") return "CANCELLED";
  return "UNKNOWN";
}

function statusReason(s: EnrollmentGateStatus) {
  switch (s) {
    case "ACTIVE":
      return undefined;
    case "PENDING":
      return "Đơn hàng/ghi danh đang PENDING. Cần admin mark-paid để ACTIVE.";
    case "CANCELLED":
      return "Bạn đã huỷ ghi danh. Cần mua/ghi danh lại để học.";
    case "NOT_ENROLLED":
      return "Bạn chưa ghi danh khoá này. Vui lòng mua/ghi danh để mở nội dung.";
    default:
      return "Không xác định trạng thái ghi danh.";
  }
}

/**
 * useEnrollmentGate(courseId)
 * - Store dùng chung toàn app, nhiều page gọi hook sẽ share cùng snapshot
 * - Mặc định auto load /me/courses khi mount
 *
 * opts.adminBypass:
 * - nếu bạn có role ADMIN ở auth store => truyền true để bypass gate
 */
export function useEnrollmentGate(
  courseId: number,
  opts?: {
    adminBypass?: boolean;
    auto?: boolean;
  }
): EnrollmentGateState {
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    if (opts?.auto === false) return;
    store.ensureLoaded().catch(() => {});
  }, [opts?.auto]);

  // ✅ normalize courseId để map get luôn đúng
  const cid = useMemo(() => {
    const n = Number(courseId);
    return Number.isFinite(n) ? n : 0;
  }, [courseId]);

  const enrollment = useMemo(() => {
    if (!Number.isFinite(cid) || cid <= 0) return null;
    return snap.byCourseId.get(cid) || null;
  }, [snap.byCourseId, cid]);

  const status = useMemo(() => normalizeStatus(enrollment), [enrollment]);

  const canAccess = useMemo(() => {
    if (!Number.isFinite(cid) || cid <= 0) return false;
    if (opts?.adminBypass) return true;
    return status === "ACTIVE";
  }, [cid, opts?.adminBypass, status]);

  // ✅ reason chỉ hiển thị khi không ACTIVE (UI sạch hơn)
  const reason = useMemo(() => {
    if (status === "ACTIVE") return undefined;
    return statusReason(status);
  }, [status]);

  return {
    courseId: cid,
    status,
    canAccess,
    reason,
    loading: snap.status === "idle" || snap.status === "loading",
    error: snap.error,
    enrollment,
    refresh: store.fetchMyCourses,
  };
}
