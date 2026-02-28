import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { coursesApi, type Course, type CourseReview, type Lesson } from "../api/courses.api";
import { enrollmentsApi } from "../api/enrollments.api";
import { progressApi, type CourseProgressRes } from "../api/progress.api";

import { LessonsSidebar } from "../components/LessonsSidebar";
import { buildSequentialRows, pickContinueLessonId } from "../shared/lessons";
import { useEnrollmentGate } from "../hooks/useEnrollmentGate";
import { studentLanguageMeta, useStudentViewPrefs, type StudentLang } from "../hooks/useStudentViewPrefs";

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
import "./StudentCoursesTheme.css";

type LessonView = Lesson & {
  order?: number | null;
  published?: boolean;
};

const tx: Record<StudentLang, Record<string, string>> = {
  vi: {
    courses: "Khoá học",
    myCourses: "Khoá học của tôi",
    myOrders: "Đơn hàng của tôi",
    order: "Mua / Ghi danh",
    cancel: "Huỷ ghi danh",
    reload: "Tải lại",
    loading: "Đang tải…",
    loadingSub: "Đang lấy course / lessons / progress.",
    continue: "Tiếp tục",
    progress: "Tiến độ",
    completed: "Hoàn thành",
    lockedRule: "Quy tắc mở khoá bài học (Sequential)",
    lessonList: "Danh sách bài học",
    darkMode: "Chế độ tối",
  },
  en: {
    courses: "Courses",
    myCourses: "My Courses",
    myOrders: "My Orders",
    order: "Order / Enroll",
    cancel: "Cancel enrollment",
    reload: "Reload",
    loading: "Loading…",
    loadingSub: "Fetching course / lessons / progress.",
    continue: "Continue",
    progress: "Progress",
    completed: "Completed",
    lockedRule: "Lesson unlock rule (Sequential)",
    lessonList: "Lesson list",
    darkMode: "Dark mode",
  },
  de: {
    courses: "Kurse",
    myCourses: "Meine Kurse",
    myOrders: "Meine Bestellungen",
    order: "Bestellen / Einschreiben",
    cancel: "Einschreibung stornieren",
    reload: "Neu laden",
    loading: "Wird geladen…",
    loadingSub: "Kurs / Lektionen / Fortschritt werden geladen.",
    continue: "Weiterlernen",
    progress: "Fortschritt",
    completed: "Abgeschlossen",
    lockedRule: "Regel zur Lektionen-Freischaltung (Sequenziell)",
    lessonList: "Lektionenliste",
    darkMode: "Dunkler Modus",
  },
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
  const { lang, setLang, theme: uiTheme, setTheme } = useStudentViewPrefs();
  const t = tx[lang];

  const gate = useEnrollmentGate(courseId, { adminBypass: false });

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonView[]>([]);
  const [progress, setProgress] = useState<CourseProgressRes | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    if (!Number.isFinite(courseId) || courseId <= 0) return;
    setLoading(true);
    setErr(null);
    setInfo(null);

    try {
      const [c, rs] = await Promise.all([coursesApi.detail(courseId), coursesApi.reviews(courseId)]);
      setCourse(c);
      setReviews(rs);
    } catch (e: any) {
      setReviews([]);
      setCourse(null);
      setLessons([]);
      setProgress(null);
      setErr(e?.message || "Cannot load course.");
      setLoading(false);
      return;
    }

    if (gate.canAccess) {
      try {
        const ls = await coursesApi.lessons(courseId);
        setLessons(sortLessons(ls as LessonView[]));
      } catch (e: any) {
        setLessons([]);
        setErr(e?.message || "Cannot load lessons.");
      }
      try {
        const p = await progressApi.courseProgress(courseId);
        setProgress(p);
      } catch {
        setProgress(null);
      }
    } else {
      try {
        const outline = await coursesApi.lessonsOutline(courseId);
        setLessons(sortLessons(outline as LessonView[]));
      } catch (e2: any) {
        setLessons([]);
        setErr(e2?.message || "Cannot load lesson outline.");
      } finally {
        setProgress(null);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!Number.isFinite(courseId) || courseId <= 0) return;
    if (gate.loading) return;
    load();
  }, [courseId, gate.loading, gate.canAccess]);

  async function onOrder() {
    if (!Number.isFinite(courseId) || courseId <= 0) return;
    setErr(null);
    setInfo(null);
    try {
      await enrollmentsApi.order(courseId);
      setInfo("Order created. Wait for admin paid confirmation to unlock content.");
      await gate.refresh();
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
      setInfo("Enrollment cancelled.");
      await gate.refresh();
      await load();
    } catch (e: any) {
      setErr(e?.message || "Cancel failed");
    }
  }

  async function onSubmitReview() {
    if (!Number.isFinite(courseId) || courseId <= 0) return;
    setErr(null);
    setInfo(null);
    setSubmittingReview(true);
    try {
      const saved = await coursesApi.submitReview(courseId, {
        stars: reviewStars,
        comment: reviewComment,
      });
      setInfo("Đã gửi đánh giá khóa học thành công.");
      setReviewComment("");
      setCourse((prev) => (prev ? { ...prev, ratingAvg: saved.ratingAvg, ratingCount: saved.ratingCount } : prev));
      const rs = await coursesApi.reviews(courseId);
      setReviews(rs);
    } catch (e: any) {
      setErr(e?.message || "Gửi đánh giá thất bại");
    } finally {
      setSubmittingReview(false);
    }
  }

  function goLesson(lessonId: number) {
    nav(`/lessons/${lessonId}?courseId=${courseId}`);
  }

  const seqRows = useMemo(() => buildSequentialRows(lessons as any, progress as any), [lessons, progress]);
  const continueLessonId = useMemo(() => {
    if (!gate.canAccess) return 0;
    return pickContinueLessonId(seqRows);
  }, [seqRows, gate.canAccess]);

  const percent = gate.canAccess ? progress?.percent ?? 0 : 0;

  return (
    <div className={`student-page student-courses-theme ${uiTheme === "dark" ? "student-courses-theme-dark" : ""}`}>
      <div className="student-shell" style={{ marginBottom: 12 }}>
        <div className="student-topbar">
          <div>
            <h2 style={{ margin: 0 }}>{course?.title || t.courses}</h2>
          </div>
          <div className="student-control-group">
            <button className="student-theme-toggle" onClick={() => setTheme(uiTheme === "dark" ? "light" : "dark")}>
              {t.darkMode}: {uiTheme === "dark" ? "ON" : "OFF"}
            </button>
            <div className="student-lang-switch">
              {(Object.keys(studentLanguageMeta) as StudentLang[]).map((code) => (
                <button key={code} className={`student-lang-option ${lang === code ? "active" : ""}`} onClick={() => setLang(code)}>
                  <img src={studentLanguageMeta[code].flagUrl} alt={studentLanguageMeta[code].label} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AppShell>
        <Container>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/courses" style={{ color: theme.colors.text, textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}>
                <IconArrowLeft /> {t.courses}
              </Link>
              <Link to="/me/courses" style={{ color: theme.colors.text, textDecoration: "none" }}>{t.myCourses}</Link>
              <Link to="/me/orders" style={{ color: theme.colors.text, textDecoration: "none" }}>{t.myOrders}</Link>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button tone="primary" onClick={onOrder} disabled={loading}>{t.order}</Button>
              <Button tone="danger" variant="ghost" onClick={onCancel} disabled={loading}>{t.cancel}</Button>
              <Button tone="neutral" variant="ghost" onClick={load} disabled={loading} leftIcon={<IconRefresh />}>{t.reload}</Button>
            </div>
          </div>

          {!gate.loading && !gate.canAccess && gate.reason && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Badge tone="warning"><IconInfo /> LOCKED</Badge>
                <div style={{ fontWeight: 800 }}>{gate.reason}</div>
              </div>
            </Card>
          )}

          {loading && <Card style={{ marginBottom: 12 }}><Title>{t.loading}</Title><SubTitle>{t.loadingSub}</SubTitle></Card>}
          {err && <Card style={{ marginBottom: 12 }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><Badge tone="danger"><IconInfo /> ERROR</Badge><div style={{ fontWeight: 800 }}>{err}</div></div></Card>}
          {info && <Card style={{ marginBottom: 12 }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><Badge tone="info"><IconInfo /> INFO</Badge><div style={{ fontWeight: 800 }}>{info}</div></div></Card>}

          {course && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ minWidth: 280, flex: "1 1 420px" }}>
                  <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: -0.3 }}>{course.title}</div>
                  <div style={{ marginTop: 8, color: theme.colors.muted, lineHeight: 1.55 }}>{course.description}</div>
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Badge tone="info">{fmtVND(course.price)}</Badge>
                    {course.published ? <Badge tone="success">PUBLISHED</Badge> : <Badge tone="danger">UNPUBLISHED</Badge>}
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Badge tone={gate.canAccess ? "success" : "warning"}>Enrollment: {gate.status}</Badge>
                  </div>
                </div>

                <div style={{ minWidth: 280, flex: "0 1 340px" }}>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <Tooltip content={<div>Continue from your latest lesson.</div>} disabled={!continueLessonId}>
                      <span>
                        <Button tone="success" onClick={() => continueLessonId && goLesson(continueLessonId)} disabled={!continueLessonId} leftIcon={<IconPlay />}>
                          {t.continue}
                        </Button>
                      </span>
                    </Tooltip>
                  </div>
                  <Hr />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>{t.progress}</div>
                    <div style={{ color: theme.colors.muted, fontSize: 13 }}>{gate.canAccess ? `${percent}%` : "—"}</div>
                  </div>
                  <div style={{ marginTop: 10, height: 10, borderRadius: 999, background: theme.shadow.soft, overflow: "hidden", border: `1px solid ${theme.colors.border}`, opacity: gate.canAccess ? 1 : 0.45 }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, percent))}%`, height: "100%", background: theme.colors.brand }} />
                  </div>
                  {gate.canAccess && progress ? (
                    <Muted><div style={{ marginTop: 10, fontSize: 12 }}>{t.completed}: <b style={{ color: theme.colors.text }}>{progress.completedLessons}/{progress.totalLessons}</b></div></Muted>
                  ) : (
                    <Muted><div style={{ marginTop: 10, fontSize: 12 }}>Progress only available when enrollment is ACTIVE.</div></Muted>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Title>Đánh giá khóa học</Title>
              <Badge tone="info">{course?.ratingAvg?.toFixed?.(1) || "0.0"} ⭐ ({course?.ratingCount || 0})</Badge>
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: theme.colors.muted }}>Số sao (1-5)</span>
                <input
                  min={1}
                  max={5}
                  type="number"
                  value={reviewStars}
                  onChange={(e) => setReviewStars(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                  style={{ background: "transparent", color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: 10, padding: "10px 12px" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: theme.colors.muted }}>Nhận xét</span>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  style={{ background: "transparent", color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: 10, padding: "10px 12px", resize: "vertical" }}
                />
              </label>
              <div>
                <Button tone="primary" onClick={onSubmitReview} disabled={submittingReview || loading}>
                  {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </Button>
              </div>
            </div>
            <Hr />
            <div style={{ display: "grid", gap: 10 }}>
              {reviews.length === 0 ? (
                <Muted>Chưa có đánh giá nào cho khóa học này.</Muted>
              ) : (
                reviews.map((rv) => (
                  <div key={rv.id} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <b>{rv.customerName}</b>
                      <Muted>{new Date(rv.createdAt).toLocaleDateString("vi-VN")}</Muted>
                    </div>
                    <div style={{ marginTop: 4, color: theme.colors.warn }}>{"★".repeat(rv.stars)}{"☆".repeat(5 - rv.stars)}</div>
                    {rv.comment ? <div style={{ marginTop: 6 }}>{rv.comment}</div> : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ marginTop: 2 }}><IconInfo /></div>
              <div><Title>{t.lockedRule}</Title><SubTitle>Complete previous lesson to unlock next one.</SubTitle></div>
            </div>
          </Card>

          <LessonsSidebar
            title={t.lessonList}
            lessons={lessons as any}
            progress={progress as any}
            rows={seqRows}
            courseId={courseId}
            primaryLabel={t.continue}
            onPrimary={(id2) => goLesson(id2)}
            secondaryLabel="Detail"
            secondaryHref={(id2) => `/lessons/${id2}?courseId=${courseId}`}
            emptyText="No lesson available."
          />
        </Container>
      </AppShell>
    </div>
  );
}
