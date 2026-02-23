// src/pages/CourseDetailPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { coursesApi, type Course, type Lesson } from "../api/courses.api";
import { enrollmentsApi } from "../api/enrollments.api";
import { progressApi, type CourseProgressRes } from "../api/progress.api";

import { LessonsSidebar } from "../components/LessonsSidebar";
import { buildSequentialRows, pickContinueLessonId } from "../shared/lessons";
import { useEnrollmentGate } from "../hooks/useEnrollmentGate";

import {
  AppShell,
  Badge,
  Button,
  Card,
  Container,
  Hr,
  Muted,
  SubTitle,
  Title,
  Tooltip,
  theme,
} from "../ui/ui";

import { IconArrowLeft, IconInfo, IconPlay, IconRefresh } from "../ui/icons";

type LessonView = Lesson & {
  order?: number | null;
  published?: boolean;
};

function fmtVND(v: number) {
  try {
    return v.toLocaleString("vi-VN") + "đ";
  } catch {
    return String(v) + "đ";
  }
}

function sortLessons(ls: LessonView[]) {
  return [...ls].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

export function CourseDetailPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const courseId = Number(id);

  const gate = useEnrollmentGate(courseId, { adminBypass: false });

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonView[]>([]);
  const [progress, setProgress] = useState<CourseProgressRes | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    if (!Number.isFinite(courseId) || courseId <= 0) return;

    setLoading(true);
    setErr(null);
    setInfo(null);

    // 1) course detail
    try {
      const c = await coursesApi.detail(courseId);
      setCourse(c);
    } catch (e: any) {
      setCourse(null);
      setLessons([]);
      setProgress(null);
      setErr(e?.message || "Không tải được course.");
      setLoading(false);
      return;
    }

    // 2) lessons/progress phụ thuộc gate
    if (gate.canAccess) {
      // ACTIVE => lessons đầy đủ + progress
      try {
        const ls = await coursesApi.lessons(courseId);
        setLessons(sortLessons(ls as LessonView[]));
      } catch (e: any) {
        setLessons([]);
        setErr(e?.message || "Không tải được lessons.");
      }

      try {
        const p = await progressApi.courseProgress(courseId);
        setProgress(p);
      } catch {
        setProgress(null);
      }
    } else {
      // NOT ACTIVE => chỉ outline (không gọi progress)
      try {
        const outline = await coursesApi.lessonsOutline(courseId);
        setLessons(sortLessons(outline as LessonView[]));
      } catch (e2: any) {
        setLessons([]);
        setErr(e2?.message || "Không tải được lessons outline.");
      } finally {
        setProgress(null);
      }
    }

    setLoading(false);
  }

  // Load lần đầu + khi gate.canAccess đổi (PENDING -> ACTIVE sẽ tự reload đúng dữ liệu)
  useEffect(() => {
    if (!Number.isFinite(courseId) || courseId <= 0) return;
    if (gate.loading) return; // chờ gate ổn định để tránh load 2 lần
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, gate.loading, gate.canAccess]);

  async function onOrder() {
    if (!Number.isFinite(courseId) || courseId <= 0) return;

    setErr(null);
    setInfo(null);

    try {
      await enrollmentsApi.order(courseId);
      setInfo(
        "Đã tạo order. Trạng thái sẽ về PENDING. Khi admin mark-paid, hệ thống sẽ tự mở khoá (ACTIVE)."
      );

      // cập nhật gate store (shared toàn app)
      await gate.refresh();

      // nếu đã ACTIVE ngay (trường hợp admin bypass/logic khác) thì load full
      // còn không thì outline vẫn hiển thị, chờ gate tự lên ACTIVE
      await load();
    } catch (e: any) {
      setErr(e?.message || "Order failed");
    }
  }

  async function onCancel() {
    if (!Number.isFinite(courseId) || courseId <= 0) return;

    setErr(null);
    setInfo(null);

    try {
      await enrollmentsApi.cancel(courseId);
      setInfo("Đã huỷ ghi danh.");

      await gate.refresh();
      await load();
    } catch (e: any) {
      setErr(e?.message || "Cancel failed");
    }
  }

  function goLesson(lessonId: number) {
    nav(`/lessons/${lessonId}?courseId=${courseId}`);
  }

  // Shared sequential rows (single source of truth)
  const seqRows = useMemo(() => buildSequentialRows(lessons as any, progress as any), [lessons, progress]);

  // Continue chỉ hợp lệ khi ACTIVE (vì cần progress ổn định)
  const continueLessonId = useMemo(() => {
    if (!gate.canAccess) return 0;
    return pickContinueLessonId(seqRows);
  }, [seqRows, gate.canAccess]);

  const percent = gate.canAccess ? progress?.percent ?? 0 : 0;

  return (
    <AppShell>
      <Container>
        {/* Top nav + actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link
              to="/courses"
              style={{
                color: theme.colors.text,
                textDecoration: "none",
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <IconArrowLeft /> Courses
            </Link>

            <Link to="/me/courses" style={{ color: theme.colors.text, textDecoration: "none" }}>
              My Courses
            </Link>

            <Link to="/me/orders" style={{ color: theme.colors.text, textDecoration: "none" }}>
              My Orders
            </Link>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button tone="primary" onClick={onOrder} disabled={loading}>
              Mua / Ghi danh
            </Button>

            <Button tone="danger" variant="ghost" onClick={onCancel} disabled={loading}>
              Huỷ ghi danh
            </Button>

            <Button
              tone="neutral"
              variant="ghost"
              onClick={load}
              disabled={loading}
              leftIcon={<IconRefresh />}
            >
              Reload
            </Button>
          </div>
        </div>

        {/* Gate banner (thống nhất theo store) */}
        {!gate.loading && !gate.canAccess && gate.reason && (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge tone="warning">
                <IconInfo /> LOCKED
              </Badge>
              <div style={{ fontWeight: 800 }}>{gate.reason}</div>
            </div>
            <div style={{ marginTop: 10, color: theme.colors.muted, fontSize: 12 }}>
              Tip: Sau khi bạn tạo order, trạng thái sẽ là <b>PENDING</b>. Khi admin mark-paid, trạng thái sẽ chuyển{" "}
              <b>ACTIVE</b> và trang này tự reload để mở khoá nội dung.
            </div>
          </Card>
        )}

        {/* Alerts */}
        {loading && (
          <Card style={{ marginBottom: 12 }}>
            <Title>Đang tải…</Title>
            <SubTitle>Đang lấy course / lessons / progress.</SubTitle>
          </Card>
        )}

        {err && (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge tone="danger">
                <IconInfo /> ERROR
              </Badge>
              <div style={{ fontWeight: 800 }}>{err}</div>
            </div>
          </Card>
        )}

        {info && (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge tone="info">
                <IconInfo /> INFO
              </Badge>
              <div style={{ fontWeight: 800 }}>{info}</div>
            </div>
          </Card>
        )}

        {/* Course header */}
        {course && (
          <Card style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div style={{ minWidth: 280, flex: "1 1 420px" }}>
                <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: -0.3 }}>
                  {course.title}
                </div>

                <div style={{ marginTop: 8, color: theme.colors.muted, lineHeight: 1.55 }}>
                  {course.description}
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Badge tone="info">Giá: {fmtVND(course.price)}</Badge>
                  {course.published ? (
                    <Badge tone="success">PUBLISHED</Badge>
                  ) : (
                    <Badge tone="danger">UNPUBLISHED</Badge>
                  )}
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Badge tone={gate.canAccess ? "success" : "warning"}>
                    Enrollment: {gate.status}
                  </Badge>
                </div>
              </div>

              <div style={{ minWidth: 280, flex: "0 1 340px" }}>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <Tooltip
                    content={
                      <div>
                        Đi tới bài đang dở:
                        <br />
                        ưu tiên <b>IN_PROGRESS</b> mới nhất, sau đó bài đầu tiên chưa completed.
                        <br />
                        (Chỉ khả dụng khi enrollment <b>ACTIVE</b>)
                      </div>
                    }
                    disabled={!continueLessonId}
                  >
                    <span>
                      <Button
                        tone="success"
                        onClick={() => {
                          if (!continueLessonId) return;
                          goLesson(continueLessonId);
                        }}
                        disabled={!continueLessonId}
                        leftIcon={<IconPlay />}
                      >
                        Continue
                      </Button>
                    </span>
                  </Tooltip>
                </div>

                <Hr />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>Progress</div>
                  <div style={{ color: theme.colors.muted, fontSize: 13 }}>
                    {gate.canAccess ? `${percent}%` : "—"}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    height: 10,
                    borderRadius: 999,
                    background: theme.shadow.soft,
                    overflow: "hidden",
                    border: `1px solid ${theme.colors.border}`,
                    opacity: gate.canAccess ? 1 : 0.45,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, percent))}%`,
                      height: "100%",
                      background: theme.colors.brand,
                    }}
                  />
                </div>

                {gate.canAccess && progress ? (
                  <Muted>
                    <div style={{ marginTop: 10, fontSize: 12 }}>
                      Hoàn thành:{" "}
                      <b style={{ color: theme.colors.text }}>
                        {progress.completedLessons}/{progress.totalLessons}
                      </b>
                    </div>
                  </Muted>
                ) : (
                  <Muted>
                    <div style={{ marginTop: 10, fontSize: 12 }}>
                      Progress chỉ hiển thị khi enrollment <b>ACTIVE</b>.
                    </div>
                  </Muted>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Rule hint */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ marginTop: 2 }}>
              <IconInfo />
            </div>
            <div>
              <Title>Quy tắc mở khoá bài học (Sequential)</Title>
              <SubTitle>
                Bạn phải <b>hoàn thành</b> bài trước để mở bài kế tiếp. Nếu Enrollment chưa{" "}
                <b>ACTIVE</b>, chỉ hiển thị outline.
              </SubTitle>
            </div>
          </div>
        </Card>

        {/* Reusable list/sidebar (no duplicated logic) */}
        <LessonsSidebar
          title="Danh sách bài học"
          lessons={lessons as any}
          progress={progress as any}
          rows={seqRows}
          courseId={courseId}
          primaryLabel="Học"
          onPrimary={(id2) => goLesson(id2)}
          secondaryLabel="Chi tiết"
          secondaryHref={(id2) => `/lessons/${id2}?courseId=${courseId}`}
          emptyText="Chưa có lesson hoặc bạn chưa có quyền xem danh sách."
        />
      </Container>
    </AppShell>
  );
}
