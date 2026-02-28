import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { enrollmentsApi, type MyCourse } from "../api/enrollments.api";
import { coursesApi, type Lesson } from "../api/courses.api";
import { progressApi, type CourseProgressRes } from "../api/progress.api";
import { studentLanguageMeta, useStudentViewPrefs, type StudentLang } from "../hooks/useStudentViewPrefs";
import "./StudentCoursesTheme.css";

const i18n: Record<StudentLang, Record<string, string>> = {
  vi: {
    title: "Khoá học của tôi",
    subtitle: "Theo dõi tiến độ học tập với giao diện nâng cấp.",
    reload: "Tải lại",
    loading: "Đang tải...",
    progress: "Tiến độ",
    price: "Giá",
    completed: "Hoàn thành",
    detail: "Xem chi tiết",
    continue: "Tiếp tục",
    cancel: "Huỷ",
    noCourse: "Bạn chưa ghi danh khoá học nào.",
    darkMode: "Chế độ tối",
    retry: "Thử lại",
  },
  en: {
    title: "My Courses",
    subtitle: "Track your learning progress in the upgraded layout.",
    reload: "Reload",
    loading: "Loading...",
    progress: "Progress",
    price: "Price",
    completed: "Completed",
    detail: "View details",
    continue: "Continue",
    cancel: "Cancel",
    noCourse: "You have not enrolled in any course.",
    darkMode: "Dark mode",
    retry: "Retry",
  },
  de: {
    title: "Meine Kurse",
    subtitle: "Verfolge deinen Lernfortschritt im neuen Layout.",
    reload: "Neu laden",
    loading: "Laden...",
    progress: "Fortschritt",
    price: "Preis",
    completed: "Abgeschlossen",
    detail: "Details",
    continue: "Weiterlernen",
    cancel: "Stornieren",
    noCourse: "Du bist in keinem Kurs eingeschrieben.",
    darkMode: "Dunkler Modus",
    retry: "Erneut versuchen",
  },
};

function sortLessons(ls: Lesson[]) {
  return [...ls].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

function StatusBadge({ status }: { status: MyCourse["status"] }) {
  const cls = useMemo(() => {
    if (status === "ACTIVE") return "student-badge student-badge-active";
    if (status === "PENDING") return "student-badge student-badge-pending";
    return "student-badge student-badge-cancelled";
  }, [status]);

  return <span className={cls}>{status}</span>;
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const p = Math.max(0, Math.min(100, percent || 0));
  return (
      <div className="student-progress">
        <div className="student-progress-meta">
          <span className="student-progress-label">{label}</span>
          <span className="student-progress-value">{p.toFixed(0)}%</span>
        </div>
        <div className="student-progress-track">
          <div className="student-progress-fill" style={{ width: `${p}%` }} />
        </div>
      </div>
  );
}

export function MyCoursesPage() {
  const nav = useNavigate();
  const { lang, setLang, theme, setTheme } = useStudentViewPrefs();
  const t = i18n[lang];

  const [items, setItems] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<number, CourseProgressRes>>({});

  async function load() {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const data = await enrollmentsApi.myCourses();
      setItems(data);

      const activeCourseIds = data.filter((d) => d.status === "ACTIVE").map((d) => d.courseId);
      const results = await Promise.allSettled(
          activeCourseIds.map(async (cid) => ({ cid, p: await progressApi.courseProgress(cid) }))
      );

      const next: Record<number, CourseProgressRes> = {};
      for (const r of results) if (r.status === "fulfilled") next[r.value.cid] = r.value.p;
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
      setInfo(`Course #${courseId} cancelled.`);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Cancel failed");
    }
  }

  async function onContinue(courseId: number) {
    setErr(null);
    setInfo(null);
    try {
      const lessons = await coursesApi.lessons(courseId);
      if (!lessons || lessons.length === 0) {
        setInfo("Course has no lesson yet.");
        return;
      }

      const lessonId = sortLessons(lessons)[0]?.id;
      if (!lessonId) return;

      nav(`/lessons/${lessonId}?courseId=${courseId}`);
    } catch (e: any) {
      setErr(e?.message || "Unable to continue");
    }
  }

  return (
      <div className={`student-page student-courses-theme ${theme === "dark" ? "student-courses-theme-dark" : ""}`}>
        <div className="student-shell">
          <div className="student-topbar">
            <div className="student-topbar-left">
              <h2 className="student-title">{t.title}</h2>
              <div className="student-subtitle">{t.subtitle}</div>
            </div>

            <div className="student-control-group">
              <button
                  type="button"
                  className={`student-theme-toggle ${theme === "dark" ? "is-on" : ""}`}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <span className="student-label">{t.darkMode}</span>
                <span className="student-pill">{theme === "dark" ? "ON" : "OFF"}</span>
              </button>

              <div className="student-lang-switch">
                {(Object.keys(studentLanguageMeta) as StudentLang[]).map((code) => (
                    <button
                        key={code}
                        type="button"
                        className={`student-lang-option ${lang === code ? "active" : ""}`}
                        onClick={() => setLang(code)}
                    >
                      <img src={studentLanguageMeta[code].flagUrl} alt={studentLanguageMeta[code].label} />
                    </button>
                ))}
              </div>
            </div>
          </div>

          {/* 🔥 CHỈ CÒN NÚT RELOAD */}
          <div className="student-actions">
            <button type="button" className="student-btn student-btn-ghost" onClick={load}>
              {t.reload}
            </button>
          </div>

          {/* Các phần còn lại giữ nguyên */}
          {loading && <div className="student-alert student-alert-info">{t.loading}</div>}
          {err && <div className="student-alert student-alert-danger">{err}</div>}
          {info && <div className="student-alert student-alert-success">{info}</div>}

          <div className="student-grid">
            {items.map((enr) => {
              const prog = progressMap[enr.courseId];
              const percent =
                  prog?.percent ??
                  (prog ? Math.round((prog.completedLessons / Math.max(1, prog.totalLessons)) * 100) : 0);

              return (
                  <div key={enr.id} className="student-card">
                    <div className="student-card-head">
                      <div className="student-card-title">{enr.course.title}</div>
                      <StatusBadge status={enr.status} />
                    </div>

                    <div className="student-meta">
                      <span className="student-meta-label">{t.price}:</span>
                      <span className="student-meta-value">
                    {enr.course.price.toLocaleString("vi-VN")}đ
                  </span>
                    </div>

                    {enr.status === "ACTIVE" && prog && (
                        <>
                          <ProgressBar percent={percent} label={t.progress} />
                          <div className="student-mini">
                            {t.completed}: {prog.completedLessons}/{prog.totalLessons}
                          </div>
                        </>
                    )}

                    <div className="student-card-actions">
                      <button
                          type="button"
                          className="student-btn student-btn-primary"
                          onClick={() => onContinue(enr.courseId)}
                          disabled={enr.status !== "ACTIVE"}
                      >
                        {t.continue}
                      </button>

                      <button
                          type="button"
                          className="student-btn student-btn-danger"
                          onClick={() => onCancel(enr.courseId)}
                          disabled={enr.status !== "ACTIVE" && enr.status !== "PENDING"}
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}