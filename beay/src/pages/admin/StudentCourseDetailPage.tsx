import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../ui/toast";
import { studentApi, type ApiCourseDetail, type ApiCourseProgress, type ApiLesson } from "../student/student.api";

type Lang = "vi" | "en" | "de";

const i18n: Record<Lang, Record<string, string>> = {
  vi: {
    title: "Chi tiết khoá học",
    descFallback: "Khoá học được đồng bộ từ API AYANAVITA.",
    back: "Quay lại",
    continue: "Tiếp tục học",
    reload: "Tải lại",
    loading: "Đang tải dữ liệu...",
    lessonList: "Danh sách bài học",
    progress: "Tiến độ",
    lessonDone: "Hoàn thành",
    price: "Giá",
    lessonCount: "Số bài",
    videoCount: "Số video",
    topic: "Chủ đề",
    duration: "Thời lượng",
    rating: "Đánh giá",
    enrolled: "Lượt ghi danh",
    status: "Trạng thái",
    objectives: "Mục tiêu khoá học",
    targetAudience: "Đối tượng phù hợp",
    benefits: "Lợi ích nhận được",
    noLesson: "Khoá học chưa có bài học.",
    updatedAt: "Cập nhật",
  },
  en: {
    title: "Course Detail",
    descFallback: "Course data is synced from AYANAVITA API.",
    back: "Back",
    continue: "Continue",
    reload: "Reload",
    loading: "Loading data...",
    lessonList: "Lesson list",
    progress: "Progress",
    lessonDone: "Completed",
    price: "Price",
    lessonCount: "Lessons",
    videoCount: "Videos",
    topic: "Topic",
    duration: "Duration",
    rating: "Rating",
    enrolled: "Enrollments",
    status: "Status",
    objectives: "Objectives",
    targetAudience: "Target audience",
    benefits: "Benefits",
    noLesson: "No lessons in this course yet.",
    updatedAt: "Updated",
  },
  de: {
    title: "Kursdetails",
    descFallback: "Kursdaten werden von der AYANAVITA-API synchronisiert.",
    back: "Zurück",
    continue: "Weiterlernen",
    reload: "Neu laden",
    loading: "Daten werden geladen...",
    lessonList: "Lektionsliste",
    progress: "Fortschritt",
    lessonDone: "Abgeschlossen",
    price: "Preis",
    lessonCount: "Lektionen",
    videoCount: "Videos",
    topic: "Thema",
    duration: "Dauer",
    rating: "Bewertung",
    enrolled: "Einschreibungen",
    status: "Status",
    objectives: "Lernziele",
    targetAudience: "Zielgruppe",
    benefits: "Vorteile",
    noLesson: "Dieser Kurs hat noch keine Lektionen.",
    updatedAt: "Aktualisiert",
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

function fmtDate(v?: string) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}

export function StudentCourseDetailPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const courseId = Number(id || 0);

  const [lang, setLang] = useState<Lang>("vi");
  const t = i18n[lang];

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [course, setCourse] = useState<ApiCourseDetail | null>(null);
  const [lessons, setLessons] = useState<ApiLesson[]>([]);
  const [progress, setProgress] = useState<ApiCourseProgress | null>(null);

  async function loadData() {
    if (!courseId) return;
    setLoading(true);
    setErr(null);
    try {
      const [courseData, progressData] = await Promise.all([
        studentApi.courseDetail(courseId, lang),
        studentApi.courseProgress(courseId),
      ]);
      const fullLessons = await studentApi.courseLessons(courseId);
      setCourse(courseData);
      setLessons(sortLessons(fullLessons));
      setProgress(progressData);
    } catch {
      try {
        const [courseData, outlineLessons] = await Promise.all([
          studentApi.courseDetail(courseId, lang),
          studentApi.courseLessonsOutline(courseId, lang),
        ]);
        setCourse(courseData);
        setLessons(sortLessons(outlineLessons));
        setProgress(null);
      } catch (e: any) {
        setErr(e?.message || "Cannot load course detail.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lang]);

  const nextLessonId = useMemo(() => {
    if (!lessons.length) return 0;
    const completed = progress?.completedLessons ?? 0;
    const idx = Math.min(completed, Math.max(0, lessons.length - 1));
    return lessons[idx]?.id || lessons[0].id;
  }, [lessons, progress]);

  function onContinue() {
    if (!nextLessonId) {
      toast("Không có bài học", t.noLesson);
      return;
    }
    nav(`/student/lessons/${nextLessonId}?courseId=${courseId}&lang=${lang}`);
  }

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "radial-gradient(1000px 500px at 15% 0%, rgba(79,70,229,0.18), transparent 60%), radial-gradient(800px 400px at 90% 10%, rgba(34,197,94,0.12), transparent 60%), linear-gradient(to bottom, #f8fafc, #eef2ff)" }}>
      <main className="px-4 md:px-8 py-6 space-y-6">
        <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-slate-500">{t.title}</div>
              <h1 className="text-2xl font-extrabold text-slate-900">{course?.title || `Course #${courseId}`}</h1>
              <p className="mt-1 max-w-4xl text-sm text-slate-600">{course?.description || t.descFallback}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["vi", "en", "de"] as Lang[]).map((code) => (
                <button key={code} className={`btn ${lang === code ? "btn-primary" : ""}`} onClick={() => setLang(code)}>{code.toUpperCase()}</button>
              ))}
              <button className="btn" onClick={() => nav("/student")}>← {t.back}</button>
              <button className="btn btn-primary" onClick={onContinue}>{t.continue}</button>
              <button className="btn" onClick={() => void loadData()}>{t.reload}</button>
            </div>
          </div>
        </div>

        {loading && <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">{t.loading}</div>}
        {err && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{err}</div>}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] lg:col-span-2">
            <h2 className="text-lg font-extrabold">{t.lessonList}</h2>
            <div className="mt-4 space-y-3">
              {lessons.map((lesson, idx) => (
                <button key={lesson.id} className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200 transition hover:bg-indigo-50 hover:ring-indigo-200" onClick={() => nav(`/student/lessons/${lesson.id}?courseId=${courseId}&lang=${lang}`)}>
                  <div className="font-bold">Bài {idx + 1}: {lesson.localizedTitle || lesson.title}</div>
                  <div className="text-xs text-slate-500">{lesson.localizedDescription || lesson.description || `Lesson ID: ${lesson.id}`}</div>
                </button>
              ))}
              {!lessons.length && !loading && <div className="text-sm text-slate-500">{t.noLesson}</div>}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <h3 className="text-lg font-extrabold">{t.progress}</h3>
            <div className="mt-3 text-sm text-slate-600">{t.lessonDone}: <b>{progress?.completedLessons || 0}/{progress?.totalLessons || lessons.length}</b></div>
            <div className="mt-2 h-[10px] overflow-hidden rounded-full border border-slate-200/70 bg-indigo-50"><div className="h-full bg-gradient-to-br from-indigo-600 to-violet-600" style={{ width: `${progress?.percent || 0}%` }} /></div>
            <div className="mt-2 text-sm"><b>{progress?.percent || 0}%</b></div>

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <div>{t.price}: <b>{course?.price?.toLocaleString("vi-VN") || 0}đ</b></div>
              <div>{t.lessonCount}: <b>{course?._count?.lessons ?? lessons.length}</b></div>
              <div>{t.videoCount}: <b>{course?.videoCount ?? 0}</b></div>
              <div>{t.topic}: <b>{course?.topic?.name || "-"}</b></div>
              <div>{t.duration}: <b>{course?.time || "-"}</b></div>
              <div>{t.rating}: <b>{course?.ratingAvg || 0} ({course?.ratingCount || 0})</b></div>
              <div>{t.enrolled}: <b>{course?.enrollmentCount || 0}</b></div>
              <div>{t.status}: <b>{course?.published ? "PUBLISHED" : "DRAFT"}</b></div>
              <div>{t.updatedAt}: <b>{fmtDate(course?.updatedAt)}</b></div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <h3 className="text-base font-extrabold">{t.objectives}</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(course?.objectives || []).map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}
              {!(course?.objectives || []).length && <li className="list-none text-slate-400">-</li>}
            </ul>
          </div>
          <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <h3 className="text-base font-extrabold">{t.targetAudience}</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(course?.targetAudience || []).map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}
              {!(course?.targetAudience || []).length && <li className="list-none text-slate-400">-</li>}
            </ul>
          </div>
          <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <h3 className="text-base font-extrabold">{t.benefits}</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(course?.benefits || []).map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}
              {!(course?.benefits || []).length && <li className="list-none text-slate-400">-</li>}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
