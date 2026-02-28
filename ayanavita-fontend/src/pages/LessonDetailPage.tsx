import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { coursesApi, type Lesson } from "../api/courses.api";
import { lessonsApi, type LessonDetail, type LessonVideoItem } from "../api/lessons.api";
import { progressApi, type CourseProgressRes } from "../api/progress.api";
import { useAuth } from "../state/auth.store";
import { studentLanguageMeta, useStudentViewPrefs, type StudentLang } from "../hooks/useStudentViewPrefs";
import "./StudentCoursesTheme.css";

const t: Record<StudentLang, Record<string, string>> = {
  vi: {
    myLearning: "Trang học viên",
    subtitle: "Theo dõi bài học theo giao diện mới đồng bộ toàn bộ trang khoá học.",
    user: "Học viên",
    course: "Khóa học",
    progress: "Tiến độ",
    lessonList: "Danh sách bài học",
    completeModule: "Hoàn thành module",
    watched: "Đã xem",
    loading: "Đang tải...",
    emptyModule: "Bài học chưa có module/video.",
    backMyCourses: "Khoá học của tôi",
    darkMode: "Chế độ tối",
  },
  en: {
    myLearning: "Student Learning",
    subtitle: "Track each lesson with the new course-wide visual style.",
    user: "User",
    course: "Course",
    progress: "Progress",
    lessonList: "Lesson list",
    completeModule: "Complete module",
    watched: "Watched",
    loading: "Loading...",
    emptyModule: "No module/video in this lesson yet.",
    backMyCourses: "My Courses",
    darkMode: "Dark mode",
  },
  de: {
    myLearning: "Lernseite",
    subtitle: "Lernfortschritt im neuen Kurs-Design verfolgen.",
    user: "Benutzer",
    course: "Kurs",
    progress: "Fortschritt",
    lessonList: "Lektionen",
    completeModule: "Modul abschließen",
    watched: "Angesehen",
    loading: "Laden...",
    emptyModule: "Diese Lektion hat noch keine Module/Videos.",
    backMyCourses: "Meine Kurse",
    darkMode: "Dunkler Modus",
  },
};

type OutlineLesson = Lesson & {
  localizedTitle?: string;
  progress?: { status?: string; percent?: number } | null;
};

export function LessonDetailPage() {
  const { id } = useParams();
  const lessonId = Number(id || 0);
  const [sp] = useSearchParams();
  const courseId = Number(sp.get("courseId") || 0);
  const nav = useNavigate();
  const { user } = useAuth();
  const { lang, setLang, theme, setTheme } = useStudentViewPrefs();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [outline, setOutline] = useState<OutlineLesson[]>([]);
  const [progress, setProgress] = useState<CourseProgressRes | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);

  const tx = t[lang];

  const doneLessons = useMemo(() => {
    const set = new Set<number>();
    outline.forEach((l) => {
      if (l.progress?.status === "COMPLETED" || (l.progress?.percent || 0) >= 100) {
        set.add(l.id);
      }
    });
    progress?.items?.forEach((x) => {
      if (x.status === "COMPLETED") set.add(x.lessonId);
    });
    return set;
  }, [outline, progress]);

  async function loadAll(targetLessonId = lessonId) {
    if (!courseId || !targetLessonId) return;
    setLoading(true);
    setErr(null);
    try {
      const [course, lessonData, outlineData, progressData] = await Promise.all([
        coursesApi.detail(courseId),
        lessonsApi.detail(targetLessonId, lang),
        coursesApi.lessonsOutline(courseId) as Promise<OutlineLesson[]>,
        progressApi.courseProgress(courseId),
      ]);

      setCourseTitle(course?.title || "");
      setLesson(lessonData);
      setOutline(outlineData || []);
      setProgress(progressData || null);
    } catch (e: any) {
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [lessonId, courseId, lang]);

  async function handleVideoDone(video: LessonVideoItem) {
    if (!lesson) return;
    await progressApi.updateVideoProgress(lesson.id, video.id, video.durationSec || 0, true);
    await loadAll(lesson.id);
  }

  async function handleModuleDone(moduleId: number) {
    if (!lesson) return;
    await progressApi.completeModule(lesson.id, moduleId);
    await loadAll(lesson.id);
  }

  return (
      <div className={`student-page student-courses-theme ${theme === "dark" ? "student-courses-theme-dark" : ""}`}>
        <div className="student-shell">

          <div className="student-topbar">
            <div>
              <h2 className="student-title">{tx.myLearning}</h2>
              <div className="student-subtitle">{tx.subtitle}</div>
            </div>

            <div className="student-control-group">
              <button
                  className="student-theme-toggle"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {tx.darkMode}
                <span className="student-pill">{theme === "dark" ? "ON" : "OFF"}</span>
              </button>

              <div className="student-lang-switch">
                {(Object.keys(studentLanguageMeta) as StudentLang[]).map((code) => (
                    <button
                        key={code}
                        className={`student-lang-option ${lang === code ? "active" : ""}`}
                        onClick={() => setLang(code)}
                    >
                      <img src={studentLanguageMeta[code].flagUrl} alt="" />
                    </button>
                ))}
              </div>
            </div>
          </div>

          <div className="student-lesson-links">
            <Link to="/me/courses" className="student-btn student-btn-ghost">
              ← {tx.backMyCourses}
            </Link>
          </div>

          <div className="student-card student-info-card" style={{ marginBottom: 20}}>
            <div className="student-info-row">
              <span className="student-info-label">{tx.user}:</span>
              <span className="student-info-value">{user?.name || user?.email || "-"}</span>
            </div>

            <div className="student-info-row">
              <span className="student-info-label">{tx.course}:</span>
              <span className="student-info-value">{courseTitle || "-"}</span>
            </div>

            <div className="student-progress">
              <div className="student-progress-meta">
                <span>{tx.progress}</span>
                <b>{progress?.percent || 0}%</b>
              </div>
              <div className="student-progress-track">
                <div
                    className="student-progress-fill"
                    style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
            </div>
          </div>

          {loading && <div className="student-card">{tx.loading}</div>}
          {err && <div className="student-card student-error">{err}</div>}

          <div className="student-lesson-layout">

            <div className="student-card">
              <h3 className="student-section-title">
                {lesson?.localizedTitle || lesson?.title || `Lesson #${lessonId}`}
              </h3>

              {!lesson?.modules?.length && (
                  <div className="student-muted">{tx.emptyModule}</div>
              )}

              {lesson?.modules?.map((m) => (
                  <div key={m.id} className="student-module-card">
                    <div className="student-module-head">
                      <div>
                        <b>{m.localizedTitle || m.title}</b>
                        <div className="student-muted small">
                          {m.progress?.percent || 0}%
                        </div>
                      </div>

                      <button
                          className="student-btn student-btn-primary"
                          onClick={() => void handleModuleDone(m.id)}
                      >
                        {tx.completeModule}
                      </button>
                    </div>

                    {m.videos?.map((v) => (
                        <div key={v.id} className="student-video-row">
                          <div>
                            <div>{v.localizedTitle || v.title}</div>
                            {!!v.playbackUrl && (
                                <video
                                    controls
                                    src={v.playbackUrl}
                                    className="student-video-player"
                                    onEnded={() => void handleVideoDone(v)}
                                />
                            )}
                          </div>

                          <button
                              className="student-btn student-btn-ghost"
                              onClick={() => void handleVideoDone(v)}
                          >
                            {tx.watched} {v.progress?.completed ? "✓" : ""}
                          </button>
                        </div>
                    ))}
                  </div>
              ))}
            </div>

            <div className="student-card">
              <h3 className="student-section-title">{tx.lessonList}</h3>

              {outline.map((l) => (
                  <button
                      key={l.id}
                      className={`student-lesson-item ${l.id === lessonId ? "active" : ""}`}
                      onClick={() => nav(`/lessons/${l.id}?courseId=${courseId}`)}
                  >
                    <span>{doneLessons.has(l.id) ? "✅" : "⬜"}</span>
                    <span>{l.localizedTitle || l.title}</span>
                  </button>
              ))}
            </div>

          </div>
        </div>
      </div>
  );
}