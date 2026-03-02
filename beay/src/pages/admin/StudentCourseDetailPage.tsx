import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../ui/toast";
import { studentApi, type ApiCourseDetail, type ApiCourseProgress, type ApiLesson, type ApiLessonDetail } from "../student/student.api";

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
    moduleCount: "Số module",
    content: "Nội dung khoá học",
    noModule: "Chưa có nội dung module.",
    heroTag: "Khoá học nổi bật",
    thumbnail: "Thumbnail khoá học",
    register: "Đăng ký",
    reviewTitle: "Đánh giá khoá học",
    noReview: "Chưa có đánh giá.",
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
    moduleCount: "Modules",
    content: "Course content",
    noModule: "No module content yet.",
    heroTag: "Featured course",
    thumbnail: "Course thumbnail",
    register: "Register",
    reviewTitle: "Course reviews",
    noReview: "No reviews yet.",
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
    moduleCount: "Module",
    content: "Kursinhalt",
    noModule: "Noch kein Modulinhalt.",
    heroTag: "Empfohlener Kurs",
    thumbnail: "Kurs-Thumbnail",
    register: "Anmelden",
    reviewTitle: "Kursbewertungen",
    noReview: "Noch keine Bewertungen.",
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
  const [lessonDetails, setLessonDetails] = useState<Record<number, ApiLessonDetail>>({});

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
      const sortedLessons = sortLessons(fullLessons);
      setLessons(sortedLessons);
      setProgress(progressData);
      const detailRows = await Promise.all(sortedLessons.map(async (lesson) => {
        try {
          const detail = await studentApi.lessonDetail(lesson.id, lang);
          return [lesson.id, detail] as const;
        } catch {
          return null;
        }
      }));
      setLessonDetails(Object.fromEntries(detailRows.filter(Boolean) as Array<[number, ApiLessonDetail]>));
    } catch {
      try {
        const [courseData, outlineLessons] = await Promise.all([
          studentApi.courseDetail(courseId, lang),
          studentApi.courseLessonsOutline(courseId, lang),
        ]);
        setCourse(courseData);
        setLessons(sortLessons(outlineLessons));
        setProgress(null);
        setLessonDetails({});
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
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700 ring-1 ring-indigo-200">
                <i className="fa-solid fa-sparkles text-violet-500" />
                {t.heroTag}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900">{course?.title || `Course #${courseId}`}</h1>
              <p className="mt-1 max-w-4xl text-sm text-slate-600">{course?.description || t.descFallback}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["vi", "en", "de"] as Lang[]).map((code) => (
                <button key={code} className={`btn ${lang === code ? "btn-primary" : ""}`} onClick={() => setLang(code)}>{code.toUpperCase()}</button>
              ))}
              <button className="btn" onClick={() => nav("/student")}><i className="fa-solid fa-arrow-left mr-1" /> {t.back}</button>
              <button className="btn btn-primary" onClick={onContinue}><i className="fa-solid fa-circle-play mr-1" /> {t.continue}</button>
              <button className="btn" onClick={() => void loadData()}><i className="fa-solid fa-rotate-right mr-1" /> {t.reload}</button>
            </div>
          </div>
        </div>

        {loading && <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">{t.loading}</div>}
        {err && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{err}</div>}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] lg:col-span-2">
            <h2 className="text-lg font-extrabold">{t.content}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700 ring-1 ring-blue-200">
                <i className="fa-solid fa-book-open text-blue-500" />
                {lessons.length} {t.lessonCount.toLowerCase()}
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700 ring-1 ring-violet-200">
                <i className="fa-solid fa-cubes text-violet-500" />
                {Object.values(lessonDetails).reduce((sum, item) => sum + (item.modules?.length || 0), 0)} {t.moduleCount.toLowerCase()}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {lessons.map((lesson, idx) => (
                <button key={lesson.id} className="w-full rounded-2xl bg-gradient-to-br from-white to-indigo-50 px-4 py-3 text-left ring-1 ring-indigo-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => nav(`/student/lessons/${lesson.id}?courseId=${courseId}&lang=${lang}`)}>
                  <div className="font-bold">Bài {idx + 1}: {lesson.localizedTitle || lesson.title}</div>
                  <div className="text-xs text-slate-500">{lesson.localizedDescription || lesson.description || `Lesson ID: ${lesson.id}`}</div>
                  <div className="mt-2 space-y-1">
                    {(lessonDetails[lesson.id]?.modules || []).map((m) => (
                      <div key={m.id} className="rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200">
                        <div className="text-sm font-bold text-slate-800">{m.localizedTitle || m.title}</div>
                        <div className="text-xs text-slate-600">{m.localizedDescription || m.description || "-"}</div>
                      </div>
                    ))}
                    {!(lessonDetails[lesson.id]?.modules || []).length && <div className="text-xs text-slate-400">{t.noModule}</div>}
                  </div>
                </button>
              ))}
              {!lessons.length && !loading && <div className="text-sm text-slate-500">{t.noLesson}</div>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-[18px] border border-white/80 bg-white/95 p-0 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <img className="h-[210px] w-full object-cover transition duration-500 hover:scale-105" src={course?.thumbnail || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop"} alt={course?.title || "course thumbnail"} />
              <div className="p-4 text-sm text-slate-600">{t.thumbnail}</div>
            </div>

            <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <h3 className="text-4xl font-black text-indigo-700">{course?.price?.toLocaleString("vi-VN") || 0} đ</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-1 font-bold text-amber-800 ring-1 ring-amber-200"><i className="fa-solid fa-clock text-amber-500" /> {course?.time || "0 Hour"}</span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-fuchsia-100 px-3 py-1 font-bold text-fuchsia-800 ring-1 ring-fuchsia-200"><i className="fa-solid fa-star text-fuchsia-500" /> {course?.ratingAvg || 0} ({course?.ratingCount || 0})</span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1 font-bold text-emerald-800 ring-1 ring-emerald-200"><i className="fa-solid fa-user-group text-emerald-500" /> {course?.enrollmentCount || 0}</span>
              </div>
              <button className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 px-4 py-3 text-lg font-extrabold text-white shadow-[0_10px_25px_rgba(99,102,241,0.35)] transition hover:brightness-110" onClick={onContinue}>{t.register}</button>
            </div>

            <div className="rounded-[18px] border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <h3 className="text-3xl font-black text-slate-900">{t.reviewTitle}</h3>
              <div className="mt-2 text-sm text-slate-600">{t.noReview}</div>
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
