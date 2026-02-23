import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { enrollmentsApi, type MyCourse } from "../api/enrollments.api";
import { coursesApi, type Lesson } from "../api/courses.api";
import { progressApi, type CourseProgressRes } from "../api/progress.api";

function StatusBadge({ status }: { status: MyCourse["status"] }) {
  const style: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid #ddd",
      background: "#fff",
    };
    if (status === "ACTIVE") return { ...base, borderColor: "#2ecc71" };
    if (status === "PENDING") return { ...base, borderColor: "#f1c40f" };
    return { ...base, borderColor: "#e74c3c" };
  }, [status]);

  return <span style={style}>{status}</span>;
}

function ProgressBar({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent || 0));
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          opacity: 0.8,
        }}
      >
        <span>Tiến độ</span>
        <span>{p.toFixed(0)}%</span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "#eee",
          overflow: "hidden",
          marginTop: 6,
        }}
      >
        <div style={{ width: `${p}%`, height: "100%", background: "#111" }} />
      </div>
    </div>
  );
}

// sort lessons ổn định theo (order, id)
function sortLessons(ls: Lesson[]) {
  return [...ls].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

export function MyCoursesPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // map courseId -> progress
  const [progressMap, setProgressMap] = useState<Record<number, CourseProgressRes>>({});

  async function load() {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const data = await enrollmentsApi.myCourses();
      setItems(data);

      // tải progress cho các course ACTIVE
      const activeCourseIds = data
        .filter((d) => d.status === "ACTIVE")
        .map((d) => d.courseId);

      const results = await Promise.allSettled(
        activeCourseIds.map(async (cid) => {
          const p = await progressApi.courseProgress(cid);
          return { cid, p };
        })
      );

      const next: Record<number, CourseProgressRes> = {};
      for (const r of results) {
        if (r.status === "fulfilled") next[r.value.cid] = r.value.p;
      }
      setProgressMap(next);
    } catch (e: any) {
      setErr(e?.message || "Load my courses failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCancel(courseId: number) {
    setErr(null);
    setInfo(null);
    try {
      await enrollmentsApi.cancel(courseId);
      setInfo(`Đã huỷ ghi danh course #${courseId}.`);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Cancel failed");
    }
  }

  // chọn lessonId để Continue theo progress
  function pickContinueLessonId(courseId: number, lessons: Lesson[]): number {
    const sorted = sortLessons(lessons);
    if (sorted.length === 0) return 0;

    const prog = progressMap[courseId];
    const pItems = prog?.items ?? [];

    // map lessonId -> { status, updatedAt }
    const byLesson: Record<number, { status: string; updatedAt?: string | undefined }> = {};
    for (const it of pItems) {
      byLesson[it.lessonId] = { status: it.status, updatedAt: it.updatedAt };
    }

    // 1) ưu tiên IN_PROGRESS mới nhất
    const inProgress = pItems
      .filter((it) => it.status === "IN_PROGRESS")
      .sort((a, b) => {
        const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bt - at;
      });

    if (inProgress.length) {
      const candId = inProgress[0].lessonId;
      if (sorted.some((l) => l.id === candId)) return candId;
    }

    // 2) lesson đầu tiên chưa COMPLETED
    for (const l of sorted) {
      const st = byLesson[l.id]?.status;
      if (st !== "COMPLETED") return l.id;
    }

    // 3) tất cả completed -> vào bài cuối
    return sorted[sorted.length - 1].id;
  }

  async function onContinue(courseId: number) {
    setErr(null);
    setInfo(null);

    try {
      // Backend sẽ 403 nếu Enrollment chưa ACTIVE
      const lessons = await coursesApi.lessons(courseId);
      if (!lessons || lessons.length === 0) {
        setInfo("Khoá học chưa có bài học nào.");
        return;
      }

      const lessonId = pickContinueLessonId(courseId, lessons);
      if (!lessonId) {
        setInfo("Không xác định được bài học để tiếp tục.");
        return;
      }

      nav(`/lessons/${lessonId}`);
    } catch (e: any) {
      setErr(
        e?.message ||
          "Không thể tiếp tục học (có thể Enrollment chưa ACTIVE nên bị chặn 403)."
      );
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Khoá học của tôi</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/courses">Khoá học</Link>
          <Link to="/me/orders">My Orders</Link>
          <button onClick={load}>Reload</button>
        </div>
      </div>

      {loading && <div style={{ padding: 12 }}>Loading...</div>}
      {err && <div style={{ padding: 12, color: "crimson" }}>{err}</div>}
      {info && <div style={{ padding: 12 }}>{info}</div>}

      {!loading && items.length === 0 && (
        <div style={{ padding: 12, opacity: 0.8 }}>
          Bạn chưa ghi danh khoá học nào. Vào{" "}
          <Link to="/courses">Khoá học</Link> để mua/ghi danh.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {items.map((enr) => {
          const prog = progressMap[enr.courseId];
          const percent =
            prog?.percent ??
            (prog
              ? Math.round(
                  (prog.completedLessons / Math.max(1, prog.totalLessons)) * 100
                )
              : 0);

          return (
            <div
              key={enr.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 14,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 800 }}>{enr.course.title}</div>
                <StatusBadge status={enr.status} />
              </div>

              <div style={{ marginTop: 8, opacity: 0.8 }}>
                Giá: {enr.course.price.toLocaleString("vi-VN")}đ
              </div>

              {enr.status === "ACTIVE" && prog && (
                <>
                  <ProgressBar percent={percent} />
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                    Hoàn thành: {prog.completedLessons}/{prog.totalLessons} bài
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <Link to={`/courses/${enr.courseId}`}>Xem chi tiết</Link>

                <button
                  onClick={() => onContinue(enr.courseId)}
                  disabled={enr.status !== "ACTIVE"}
                  title={
                    enr.status !== "ACTIVE"
                      ? "Chỉ học được khi Enrollment ACTIVE"
                      : "Tiếp tục học đúng bài đang dở"
                  }
                >
                  Continue
                </button>

                <button
                  onClick={() => onCancel(enr.courseId)}
                  disabled={enr.status !== "ACTIVE" && enr.status !== "PENDING"}
                  title="Huỷ ghi danh"
                >
                  Cancel
                </button>
              </div>

              {enr.status !== "ACTIVE" && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  Ghi chú: Nếu bạn vừa tạo order, cần Admin mark-paid để kích hoạt
                  (ACTIVE) trước khi xem bài học.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
