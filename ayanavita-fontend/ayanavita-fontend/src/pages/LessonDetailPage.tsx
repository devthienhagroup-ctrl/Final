// src/pages/LessonDetailPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { coursesApi, type Lesson } from "../api/courses.api";
import { progressApi, type CourseProgressRes } from "../api/progress.api";
import { lessonsApi, type LessonDetail } from "../api/lessons.api";

import { LessonsSidebar } from "../components/LessonsSidebar";
import { EnrollmentGatePanel } from "../components/EnrollmentGatePanel";
import { useEnrollmentGate } from "../hooks/useEnrollmentGate";

import {
  buildSequentialRows,
  getLessonNavFromRows,
  statusOf,
  type LessonStatusUI,
} from "../shared/lessons";

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

import {
  IconArrowLeft,
  IconCheck,
  IconInfo,
  IconLock,
  IconPlay,
  IconRefresh,
} from "../ui/icons";

type LessonView = Lesson & {
  order?: number | null;
  published?: boolean;
};

function sortLessons(ls: LessonView[]) {
  return [...ls].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatch(m.matches);
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);

  return match;
}

function StatusBadge({ status }: { status: LessonStatusUI }) {
  if (status === "COMPLETED") {
    return (
      <Badge tone="success">
        <IconCheck /> COMPLETED
      </Badge>
    );
  }
  if (status === "IN_PROGRESS") return <Badge tone="warning">IN_PROGRESS</Badge>;
  return <Badge tone="neutral">NOT_STARTED</Badge>;
}

type ViewMode = "LOADING" | "ENROLLMENT_BLOCKED" | "SEQUENTIAL_LOCKED" | "CONTENT";

function DebugRibbon(props: {
  enabled: boolean;
  courseId: number;
  lessonId: number;
  viewMode: string;
  gateStatus: string;
  gateLoading: boolean;
  canAccess: boolean;
  unlocked: boolean;
  prevId: number;
  nextId: number;
}) {
  if (!props.enabled) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 14,
        border: `1px solid ${theme.colors.border}`,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Badge tone="info">DEBUG</Badge>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        viewMode=<b style={{ color: theme.colors.text }}>{props.viewMode}</b>
      </span>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        gate.status=<b style={{ color: theme.colors.text }}>{props.gateStatus}</b>
      </span>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        gate.loading=<b style={{ color: theme.colors.text }}>{String(props.gateLoading)}</b>
      </span>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        gate.canAccess=<b style={{ color: theme.colors.text }}>{String(props.canAccess)}</b>
      </span>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        unlocked=<b style={{ color: theme.colors.text }}>{String(props.unlocked)}</b>
      </span>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        courseId=<b style={{ color: theme.colors.text }}>{props.courseId}</b>
      </span>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        lessonId=<b style={{ color: theme.colors.text }}>{props.lessonId}</b>
      </span>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        prev=<b style={{ color: theme.colors.text }}>{props.prevId || "-"}</b>
      </span>

      <span style={{ fontSize: 12, color: theme.colors.muted }}>
        next=<b style={{ color: theme.colors.text }}>{props.nextId || "-"}</b>
      </span>
    </div>
  );
}


export function LessonDetailPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const lessonId = Number(id);

  const [sp] = useSearchParams();
  const courseId = Number(sp.get("courseId") || 0);

  // Enrollment gate: Order -> Pending -> Active
  const gate = useEnrollmentGate(courseId, { adminBypass: false, auto: true });

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [courseLessons, setCourseLessons] = useState<LessonView[]>([]);
  const [progress, setProgress] = useState<CourseProgressRes | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Derived
  const isWide = useMediaQuery("(min-width: 980px)");
  const hasCourseId = Number.isFinite(courseId) && courseId > 0;

  /**
   * Seq rows used for sidebar + prev/next + status.
   * Note: when progress = null, buildSequentialRows should still produce a stable structure.
   */
  const seqRows = useMemo(() => buildSequentialRows(courseLessons as any, progress as any), [
    courseLessons,
    progress,
  ]);

  const lessonNav = useMemo(() => getLessonNavFromRows(seqRows, lessonId), [seqRows, lessonId]);

  const currentStatus: LessonStatusUI = useMemo(() => statusOf(seqRows, lessonId), [seqRows, lessonId]);

  const enrollmentBlocked = useMemo(() => {
    if (!hasCourseId) return false;
    if (gate.loading) return true; // treat as blocked until known
    return gate.status !== "ACTIVE";
  }, [hasCourseId, gate.loading, gate.status]);

  const sequentialLocked = useMemo(() => {
    // Sequential lock only meaningful when enrollment is active and we have rows
    if (!hasCourseId) return false;
    if (gate.loading) return false;
    if (gate.status !== "ACTIVE") return false;
    return !lessonNav.unlocked;
  }, [hasCourseId, gate.loading, gate.status, lessonNav.unlocked]);

  const viewMode: ViewMode = useMemo(() => {
    if (loading) return "LOADING";
    if (enrollmentBlocked) return "ENROLLMENT_BLOCKED";
    if (sequentialLocked) return "SEQUENTIAL_LOCKED";
    return "CONTENT";
  }, [loading, enrollmentBlocked, sequentialLocked]);

  async function loadAll() {
    if (!Number.isFinite(lessonId) || lessonId <= 0) return;

    setLoading(true);
    setErr(null);
    setInfo(null);

    // --------
    // 1) Load lessons list + progress depending on enrollment gate
    // --------
    let lessonsList: LessonView[] = [];
    let prog: CourseProgressRes | null = null;

    if (hasCourseId) {
      // If enrollment not ACTIVE (or still loading), do NOT fetch gated lessons/progress.
      // Use outline instead to render sidebar.
      if (!gate.loading && gate.status === "ACTIVE") {
        const [lsRes, pRes] = await Promise.allSettled([
          coursesApi.lessons(courseId),
          progressApi.courseProgress(courseId),
        ]);

        if (lsRes.status === "fulfilled") lessonsList = sortLessons(lsRes.value as LessonView[]);
        else {
          lessonsList = [];
          setErr((lsRes as any)?.reason?.message || "Không tải được lessons.");
        }

        if (pRes.status === "fulfilled") prog = pRes.value;
        else prog = null;
      } else {
        // Not ACTIVE (PENDING/NOT_ENROLLED/CANCELLED/UNKNOWN or loading): outline only
        try {
          const outline = await coursesApi.lessonsOutline(courseId);
          lessonsList = sortLessons(outline as LessonView[]);
        } catch {
          lessonsList = [];
        }
        prog = null;
      }
    }

    setCourseLessons(lessonsList);
    setProgress(prog);

    // --------
    // 2) Decide whether to fetch lesson detail
    //    “Đúng chuẩn”: chỉ fetch detail khi:
    //      - Enrollment ACTIVE (nếu có courseId)
    //      - Và lesson unlocked theo sequential (nếu có courseId)
    // --------
    let shouldFetchDetail = true;

    if (hasCourseId) {
      // Enrollment not ACTIVE OR still loading => do not fetch detail
      if (gate.loading || gate.status !== "ACTIVE") shouldFetchDetail = false;
      else {
        // Compute unlocked from freshly fetched lessons/progress (avoid relying on stale state)
        const rowsNow = buildSequentialRows(lessonsList as any, prog as any);
        const navNow = getLessonNavFromRows(rowsNow, lessonId);
        if (!navNow.unlocked) shouldFetchDetail = false;
      }
    }

    if (!shouldFetchDetail) {
      setLesson(null);
      setLoading(false);
      return;
    }

    // --------
    // 3) Fetch detail (gated endpoint)
    // --------
    try {
      const d = await lessonsApi.detail(lessonId);
      setLesson(d);

      // touch progress (IN_PROGRESS) – best effort
      lessonsApi.touchProgress(lessonId).catch(() => {});
    } catch (e: any) {
      setLesson(null);
      // 403 or other errors: show message; UI will show gating blocks if courseId present
      setErr(e?.message || "Bạn không có quyền xem nội dung bài học.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadAll();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, courseId, gate.loading, gate.status]);

  async function onComplete() {
    setBusy(true);
    setErr(null);
    setInfo(null);

    try {
      await lessonsApi.complete(lessonId);
      setInfo("Đã hoàn thành bài. Đang cập nhật tiến độ…");

      // Refresh progress & compute next unlocked
      let nextId = 0;

      if (hasCourseId && !gate.loading && gate.status === "ACTIVE") {
        try {
          const p = await progressApi.courseProgress(courseId);
          setProgress(p);

          const rowsNew = buildSequentialRows(courseLessons as any, p as any);
          nextId = getLessonNavFromRows(rowsNew, lessonId).nextId;
        } catch {
          // ignore
        }
      }

      if (nextId) nav(`/lessons/${nextId}?courseId=${courseId}`);
    } catch (e: any) {
      setErr(e?.message || "Complete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <Container>
        {/* Top bar */}
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
              to={hasCourseId ? `/courses/${courseId}` : "/courses"}
              style={{
                color: theme.colors.text,
                textDecoration: "none",
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <IconArrowLeft /> Quay lại
            </Link>

            {hasCourseId ? (
              <Link to={`/courses/${courseId}`} style={{ color: theme.colors.text, textDecoration: "none" }}>
                Course Detail
              </Link>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              tone="neutral"
              variant="ghost"
              onClick={() => void loadAll()}
              disabled={loading || busy}
              leftIcon={<IconRefresh />}
            >
              Reload
            </Button>
          </div>
        </div>

        {/* Debug ribbon (DEV only) */}
<DebugRibbon
  enabled={import.meta.env.DEV || sp.get("debug") === "1"}
  courseId={courseId}
  lessonId={lessonId}
  viewMode={viewMode}
  gateStatus={gate.status}
  gateLoading={gate.loading}
  canAccess={gate.canAccess}
  unlocked={lessonNav.unlocked}
  prevId={lessonNav.prevId}
  nextId={lessonNav.nextId}
/>


        {/* Alerts */}
        {loading ? (
          <Card style={{ marginBottom: 12 }}>
            <Title>Đang tải…</Title>
            <SubTitle>Đang lấy lessons/progress và kiểm tra quyền truy cập.</SubTitle>
          </Card>
        ) : null}

        {err ? (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge tone="danger">
                <IconInfo /> ERROR
              </Badge>
              <div style={{ fontWeight: 800 }}>{err}</div>
            </div>
          </Card>
        ) : null}

        {info ? (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge tone="info">
                <IconInfo /> INFO
              </Badge>
              <div style={{ fontWeight: 800 }}>{info}</div>
            </div>
          </Card>
        ) : null}

        {/* Header */}
        <Card style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div style={{ minWidth: 280, flex: "1 1 520px" }}>
              <Title>{lesson?.title || `Lesson #${lessonId}`}</Title>
              <SubTitle>
                Trạng thái: <StatusBadge status={currentStatus} />
                {hasCourseId ? (
                  <span style={{ marginLeft: 10, color: theme.colors.faint, fontSize: 12 }}>
                    courseId={courseId}
                  </span>
                ) : null}
              </SubTitle>
            </div>

            <div
              style={{
                minWidth: 280,
                flex: "0 1 360px",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Button
                tone="success"
                onClick={() => void onComplete()}
                disabled={
                  busy ||
                  loading ||
                  viewMode !== "CONTENT" ||
                  !lessonNav.unlocked ||
                  (hasCourseId ? gate.status !== "ACTIVE" : false)
                }
                leftIcon={<IconCheck />}
              >
                Hoàn thành
              </Button>

              <Tooltip content="Bài học bị khoá theo sequential rule" disabled={lessonNav.unlocked}>
                <span>
                  <Button
                    tone="primary"
                    variant="ghost"
                    disabled={busy || !lessonNav.nextId}
                    leftIcon={<IconPlay />}
                    onClick={() => {
                      if (!lessonNav.nextId) return;
                      nav(`/lessons/${lessonNav.nextId}?courseId=${courseId}`);
                    }}
                  >
                    Next
                  </Button>
                </span>
              </Tooltip>
            </div>
          </div>

          <Hr />

          {!lessonNav.unlocked && hasCourseId && !gate.loading && gate.status === "ACTIVE" ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge tone="warning">
                <IconLock /> LOCKED
              </Badge>
              <Muted>Hoàn thành bài trước để mở khoá bài này.</Muted>
            </div>
          ) : null}
        </Card>

        {/* 2-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isWide ? "320px 1fr" : "1fr",
            gap: 12,
            alignItems: "start",
          }}
        >
          {/* Sidebar */}
          <LessonsSidebar
            lessons={courseLessons as any}
            progress={progress as any}
            rows={seqRows}
            currentLessonId={lessonId}
            courseId={courseId}
            sticky={isWide}
            title="Lessons"
            primaryLabel="Mở"
            onPrimary={(id2) => nav(`/lessons/${id2}?courseId=${courseId}`)}
          />

          {/* Main */}
          <div style={{ display: "grid", gap: 12 }}>
            {/* Enrollment gate */}
            {viewMode === "ENROLLMENT_BLOCKED" ? (
              <div style={{ display: "grid", gap: 12 }}>
                <EnrollmentGatePanel
                  courseId={courseId}
                  adminBypass={false}
                  title="Nội dung đang bị khoá"
                  pollMs={5000}
                  showOrdersLink={true}
                  onBecameActive={() => {
                    // vừa ACTIVE => reload full lessons/progress/content
                    void loadAll();
                  }}
                />

                <Card>
                  <Title>Không thể xem nội dung</Title>
                  <SubTitle>
                    Nội dung yêu cầu Enrollment <b>ACTIVE</b>. Nếu bạn vừa tạo order, trạng thái sẽ về{" "}
                    <b>PENDING</b> và tự mở khi admin mark-paid.
                  </SubTitle>
                </Card>
              </div>
            ) : null}

            {/* Sequential locked (Enrollment ACTIVE but not unlocked) */}
            {viewMode === "SEQUENTIAL_LOCKED" ? (
              <Card>
                <Title>Bài học đang bị khoá (Sequential)</Title>
                <SubTitle>
                  Bạn cần hoàn thành bài trước để mở bài này. Đây là khóa theo lộ trình.
                </SubTitle>
                <Hr />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Badge tone="warning">
                    <IconLock /> LOCKED
                  </Badge>

                  <Button
                    tone="neutral"
                    variant="ghost"
                    disabled={!lessonNav.prevId}
                    onClick={() => {
                      if (!lessonNav.prevId) return;
                      nav(`/lessons/${lessonNav.prevId}?courseId=${courseId}`);
                    }}
                  >
                    Về bài trước
                  </Button>

                  <Button tone="neutral" variant="ghost" onClick={() => void loadAll()} leftIcon={<IconRefresh />}>
                    Kiểm tra lại
                  </Button>
                </div>
              </Card>
            ) : null}

            {/* Content */}
            {viewMode === "CONTENT" ? (
              <Card>
                <Title>Nội dung bài học</Title>
                <SubTitle>Chỉ hiển thị khi Enrollment ACTIVE và lesson unlocked.</SubTitle>
                <Hr />

                {lesson?.content ? (
                  <div
                    style={{ lineHeight: 1.7, color: theme.colors.text }}
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                ) : (
                  <Muted>Chưa có content hoặc backend không trả content.</Muted>
                )}
              </Card>
            ) : null}

            {/* When loading but already rendered list */}
            {viewMode === "LOADING" ? (
              <Card>
                <Title>Đang kiểm tra quyền truy cập…</Title>
                <SubTitle>Vui lòng chờ.</SubTitle>
              </Card>
            ) : null}

            {/* Quick nav */}
            {hasCourseId ? (
              <Card>
                <Title>Điều hướng nhanh</Title>
                <SubTitle>Prev/Next dựa theo lessons trong course + sequential rule.</SubTitle>
                <Hr />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button
                    tone="neutral"
                    variant="ghost"
                    disabled={!lessonNav.prevId}
                    onClick={() => {
                      if (!lessonNav.prevId) return;
                      nav(`/lessons/${lessonNav.prevId}?courseId=${courseId}`);
                    }}
                  >
                    Prev
                  </Button>

                  <Button
                    tone="primary"
                    variant="ghost"
                    disabled={!lessonNav.nextId}
                    onClick={() => {
                      if (!lessonNav.nextId) return;
                      nav(`/lessons/${lessonNav.nextId}?courseId=${courseId}`);
                    }}
                  >
                    Next (Unlocked)
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
