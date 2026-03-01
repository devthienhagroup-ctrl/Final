import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useToast } from "../../ui/toast";
import { studentApi, type ApiCourseProgress, type ApiLesson, type ApiLessonDetail, type ApiLessonVideo } from "../student/student.api";

type Lang = "vi" | "en" | "de";

const i18n: Record<Lang, Record<string, string>> = {
  vi: {
    page: "Trang tiếp tục học",
    course: "Khoá học",
    progress: "Tiến độ khoá học",
    detailCourse: "Chi tiết khoá",
    backPortal: "Về trang học viên",
    reload: "Tải lại",
    loading: "Đang tải...",
    lessonContent: "Nội dung bài học",
    empty: "Bài học chưa có module/video.",
    completeModule: "Hoàn thành module",
    watched: "Đã xem",
    lessonList: "Danh sách bài học",
    lessonDesc: "Mô tả bài học",
    moduleDesc: "Mô tả module",
    videoDesc: "Mô tả video",
  },
  en: {
    page: "Continue Learning",
    course: "Course",
    progress: "Course progress",
    detailCourse: "Course detail",
    backPortal: "Back to portal",
    reload: "Reload",
    loading: "Loading...",
    lessonContent: "Lesson content",
    empty: "No module/video in this lesson yet.",
    completeModule: "Complete module",
    watched: "Watched",
    lessonList: "Lesson list",
    lessonDesc: "Lesson description",
    moduleDesc: "Module description",
    videoDesc: "Video description",
  },
  de: {
    page: "Weiterlernen",
    course: "Kurs",
    progress: "Kursfortschritt",
    detailCourse: "Kursdetails",
    backPortal: "Zur Lernseite",
    reload: "Neu laden",
    loading: "Wird geladen...",
    lessonContent: "Lektionsinhalt",
    empty: "Diese Lektion hat noch keine Module/Videos.",
    completeModule: "Modul abschließen",
    watched: "Angesehen",
    lessonList: "Lektionen",
    lessonDesc: "Lektionsbeschreibung",
    moduleDesc: "Modulbeschreibung",
    videoDesc: "Videobeschreibung",
  },
};

function sortLessons(ls: ApiLesson[]) {
  return [...ls].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

export function StudentLessonPlayerPage() {
  const nav = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [sp] = useSearchParams();
  const lessonId = Number(id || 0);
  const courseId = Number(sp.get("courseId") || 0);
  const lang = (sp.get("lang") as Lang) || "vi";
  const t = i18n[lang];

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [outline, setOutline] = useState<ApiLesson[]>([]);
  const [progress, setProgress] = useState<ApiCourseProgress | null>(null);
  const [lesson, setLesson] = useState<ApiLessonDetail | null>(null);
  const [courseTitle, setCourseTitle] = useState("");

  async function loadAll(targetLessonId = lessonId) {
    if (!courseId || !targetLessonId) return;
    setLoading(true);
    setErr(null);
    try {
      const [course, lessonData, outlineData, progressData] = await Promise.all([
        studentApi.courseDetail(courseId, lang),
        studentApi.lessonDetail(targetLessonId, lang),
        studentApi.courseLessonsOutline(courseId, lang),
        studentApi.courseProgress(courseId),
      ]);
      setCourseTitle(course.title || "");
      setLesson(lessonData);
      setOutline(sortLessons(outlineData || []));
      setProgress(progressData || null);
    } catch (e: any) {
      setErr(e?.message || "Cannot load learning page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, courseId, lang]);

  async function markVideoDone(video: ApiLessonVideo) {
    if (!lesson) return;
    try {
      await studentApi.updateVideoProgress(lesson.id, video.id, video.durationSec || 0, true);
      await loadAll(lesson.id);
    } catch (e: any) {
      toast("Error", e?.message || "Cannot update video progress.");
    }
  }

  async function completeModule(moduleId: number) {
    if (!lesson) return;
    try {
      await studentApi.completeModule(lesson.id, moduleId);
      await loadAll(lesson.id);
    } catch (e: any) {
      toast("Error", e?.message || "Cannot update module progress.");
    }
  }

  const doneLessons = useMemo(() => {
    const done = new Set<number>();
    outline.forEach((l) => {
      if (l.progress?.status === "COMPLETED" || (l.progress?.percent || 0) >= 100) done.add(l.id);
    });
    progress?.items?.forEach((x) => {
      if (x.status === "COMPLETED") done.add(x.lessonId);
    });
    return done;
  }, [outline, progress]);

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "radial-gradient(1000px 500px at 15% 0%, rgba(79,70,229,0.18), transparent 60%), radial-gradient(800px 400px at 90% 10%, rgba(56,189,248,0.12), transparent 60%), linear-gradient(to bottom, #f8fafc, #eef2ff)" }}>
      <main className="px-4 py-6 md:px-8 space-y-6">
        <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-slate-500">{t.page}</div>
              <h1 className="text-2xl font-extrabold">{lesson?.localizedTitle || lesson?.title || `Lesson #${lessonId}`}</h1>
              <div className="text-sm text-slate-600">{t.course}: {courseTitle || "-"}</div>
              <div className="mt-2 text-sm text-slate-700"><b>{t.lessonDesc}:</b> {lesson?.localizedDescription || lesson?.description || "-"}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => nav(`/student/courses/${courseId}`)}>← {t.detailCourse}</button>
              <button className="btn" onClick={() => nav("/student")}>{t.backPortal}</button>
              <button className="btn" onClick={() => void loadAll()}>{t.reload}</button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-slate-600"><span>{t.progress}</span><b>{progress?.percent || 0}%</b></div>
            <div className="mt-2 h-[10px] overflow-hidden rounded-full border border-slate-200/70 bg-indigo-50"><div className="h-full bg-gradient-to-br from-indigo-600 to-violet-600" style={{ width: `${progress?.percent || 0}%` }} /></div>
          </div>
        </div>

        {loading && <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">{t.loading}</div>}
        {err && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{err}</div>}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] lg:col-span-2">
            <h2 className="text-lg font-extrabold">{t.lessonContent}</h2>
            {!lesson?.modules?.length && <div className="mt-3 text-sm text-slate-500">{t.empty}</div>}

            <div className="mt-4 space-y-4">
              {lesson?.modules?.map((m) => (
                <div key={m.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold">{m.localizedTitle || m.title}</div>
                      <div className="text-xs text-slate-500">{m.progress?.percent || 0}%</div>
                      <div className="mt-1 text-sm text-slate-600"><b>{t.moduleDesc}:</b> {m.localizedDescription || m.description || "-"}</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => void completeModule(m.id)}>{t.completeModule}</button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {m.videos?.map((v) => (
                      <div key={v.id} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                        <div className="mb-2 font-semibold">{v.localizedTitle || v.title}</div>
                        <div className="mb-2 text-xs text-slate-500"><b>{t.videoDesc}:</b> {v.localizedDescription || v.description || "-"}</div>
                        {v.playbackUrl && (
                          <video className="w-full rounded-lg border border-slate-200" controls src={v.playbackUrl} onEnded={() => void markVideoDone(v)} />
                        )}
                        <div className="mt-2 flex justify-end">
                          <button className="btn" onClick={() => void markVideoDone(v)}>{t.watched} {v.progress?.completed ? "✓" : ""}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <h3 className="text-lg font-extrabold">{t.lessonList}</h3>
            <div className="mt-3 space-y-2">
              {outline.map((l) => (
                <button key={l.id} className={`w-full rounded-xl px-3 py-2 text-left ring-1 ${l.id === lessonId ? "bg-indigo-50 ring-indigo-200" : "bg-slate-50 ring-slate-200"}`} onClick={() => nav(`/student/lessons/${l.id}?courseId=${courseId}&lang=${lang}`)}>
                  <span className="mr-2">{doneLessons.has(l.id) ? "✅" : "⬜"}</span>
                  <span>{l.localizedTitle || l.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
