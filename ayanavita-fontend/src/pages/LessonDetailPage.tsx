import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { coursesApi, type Lesson } from "../api/courses.api";
import { lessonsApi, type LessonDetail, type LessonVideoItem } from "../api/lessons.api";
import { progressApi, type CourseProgressRes } from "../api/progress.api";
import { useAuth } from "../state/auth.store";

const t = {
  vi: {
    myLearning: "Trang học viên",
    user: "Học viên",
    course: "Khóa học",
    progress: "Tiến độ",
    lessonList: "Danh sách bài học",
    completeModule: "Hoàn thành module",
    watched: "Đã xem hết",
  },
  en: {
    myLearning: "Student Learning",
    user: "User",
    course: "Course",
    progress: "Progress",
    lessonList: "Lesson list",
    completeModule: "Complete module",
    watched: "Watched",
  },
  de: {
    myLearning: "Lernseite",
    user: "Benutzer",
    course: "Kurs",
    progress: "Fortschritt",
    lessonList: "Lektionen",
    completeModule: "Modul abschließen",
    watched: "Angesehen",
  },
} as const;

type Lang = keyof typeof t;

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

  const [lang, setLang] = useState<Lang>("vi");
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
      if (l.progress?.status === "COMPLETED" || (l.progress?.percent || 0) >= 100) set.add(l.id);
    });
    if (progress?.items) {
      progress.items.forEach((x) => {
        if (x.status === "COMPLETED") set.add(x.lessonId);
      });
    }
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
      setErr(e?.message || "Không tải được dữ liệu bài học");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div style={{ maxWidth: 1200, margin: "20px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2>{tx.myLearning}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/me/courses">/me/courses</Link>
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="vi">VI</option>
            <option value="en">EN</option>
            <option value="de">DE</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12, opacity: 0.9 }}>
        <div>{tx.user}: <b>{user?.name || user?.email || "-"}</b></div>
        <div>{tx.course}: <b>{courseTitle || "-"}</b></div>
      </div>

      <div style={{ height: 10, borderRadius: 999, background: "#ececec", overflow: "hidden" }}>
        <div style={{ height: "100%", background: "#111", width: `${progress?.percent || 0}%` }} />
      </div>
      <div style={{ margin: "6px 0 12px" }}>{tx.progress}: <b>{progress?.percent || 0}%</b></div>

      {loading && <div>Loading...</div>}
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h3>{lesson?.localizedTitle || lesson?.title || `Lesson #${lessonId}`}</h3>
          {!lesson?.modules?.length && <div style={{ opacity: 0.7 }}>Lesson chưa có module/video.</div>}

          {lesson?.modules?.map((m) => (
            <div key={m.id} style={{ marginTop: 10, border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <b>{m.localizedTitle || m.title}</b>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{m.progress?.percent || 0}%</div>
                </div>
                <button onClick={() => void handleModuleDone(m.id)}>{tx.completeModule}</button>
              </div>

              {m.videos?.map((v) => (
                <div key={v.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 8, alignItems: "center" }}>
                  <div>
                    <div>{v.localizedTitle || v.title}</div>
                    {!!v.playbackUrl && (
                      <video
                        controls
                        src={v.playbackUrl}
                        style={{ width: "100%", marginTop: 6, borderRadius: 8 }}
                        onEnded={() => void handleVideoDone(v)}
                      />
                    )}
                  </div>
                  <button onClick={() => void handleVideoDone(v)}>
                    {tx.watched} {v.progress?.completed ? "✓" : ""}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h3>{tx.lessonList}</h3>
          {outline.map((l) => (
            <button
              key={l.id}
              style={{ width: "100%", textAlign: "left", marginBottom: 8, border: "1px solid #eee", borderRadius: 8, padding: 8, background: l.id === lessonId ? "#f6f3ff" : "#fff" }}
              onClick={() => nav(`/lessons/${l.id}?courseId=${courseId}`)}
            >
              <span style={{ marginRight: 6 }}>▾</span>
              <span>{doneLessons.has(l.id) ? "✅" : "⬜"} {l.localizedTitle || l.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
