import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../app/auth";
import { useToast } from "../../ui/toast";
import { studentApi, type ApiCourseDetail, type ApiCourseProgress, type ApiCourseReview, type ApiLesson, type ApiLessonDetail, type ApiLessonVideo } from "../student/student.api";

type Lang = "vi" | "en" | "de";
type RatingState = { stars: number; comment: string; createdAt: string };

const clamp2: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const availableLangs: Lang[] = ["vi", "en", "de"];

function normalizeLang(value: string | null): Lang {
  if (value === "en" || value === "de" || value === "vi") return value;
  return "vi";
}

const i18n: Record<Lang, Record<string, string>> = {
  vi: {
    title: "COURSE DETAIL",
    back: "Quay lại",
    continue: "Start learning",
    reset: "Reset progress",
    loading: "Đang tải dữ liệu...",
    lessonList: "Nội dung khoá học",
    progress: "Tiến độ",
    objective: "Mục tiêu",
    audience: "Đối tượng",
    benefits: "Lợi ích",
    noLesson: "Khoá học chưa có bài học.",
    reviewTitle: "Đánh giá khoá học",
    reviewDone: "Bạn đã đánh giá khoá học này.",
    reviewOnce: "Mỗi học viên chỉ được đánh giá 1 lần / 1 khoá học.",
    submit: "Gửi đánh giá",
    continueLesson: "Player",
    noModule: "Bài học chưa có module/video.",
    completeModule: "Đánh dấu hoàn thành",
    watched: "Đã xem",
    descCourse: "Mô tả khoá học",
    descLesson: "Mô tả bài học",
    descModule: "Mô tả module",
    defaultCourseSummary: "Player + giáo trình + quiz + bài tập.",
    beginner: "Cơ bản",
    lessonLabel: "Bài",
    noLessonDescription: "Không có mô tả.",
    noComment: "(Không có nhận xét)",
    reviewPlaceholder: "Chia sẻ cảm nhận của bạn...",
    toastNotice: "Thông báo",
    toastNoLesson: "Chưa có bài học để bắt đầu.",
    toastSuccess: "Thành công",
    toastResetSuccess: "Đã reset tiến độ khoá học.",
    toastError: "Lỗi",
    toastResetFail: "Không thể reset tiến độ.",
    toastReviewSuccess: "Đã gửi đánh giá khoá học.",
    courseFallback: "Khoá học",
    minute: "phút",
    hourUnit: "giờ",
    cannotLoadCourse: "Không thể tải chi tiết khoá học.",
    logout: "Đăng xuất",
  },
  en: {
    title: "COURSE DETAIL",
    back: "Back",
    continue: "Start learning",
    reset: "Reset progress",
    loading: "Loading data...",
    lessonList: "Curriculum",
    progress: "Progress",
    objective: "Objectives",
    audience: "Target audience",
    benefits: "Benefits",
    noLesson: "No lessons yet.",
    reviewTitle: "Course review",
    reviewDone: "You already reviewed this course.",
    reviewOnce: "Each student can review only once per course.",
    submit: "Submit review",
    continueLesson: "Player",
    noModule: "No modules/videos yet.",
    completeModule: "Mark done",
    watched: "Watched",
    descCourse: "Course description",
    descLesson: "Lesson description",
    descModule: "Module description",
    defaultCourseSummary: "Player + curriculum + quiz + assignment.",
    beginner: "Beginner",
    lessonLabel: "Lesson",
    noLessonDescription: "No description.",
    noComment: "(No comment)",
    reviewPlaceholder: "Share your feedback...",
    toastNotice: "Notice",
    toastNoLesson: "No lesson available to start.",
    toastSuccess: "Success",
    toastResetSuccess: "Course progress has been reset.",
    toastError: "Error",
    toastResetFail: "Cannot reset course progress.",
    toastReviewSuccess: "Course review submitted.",
    courseFallback: "Course",
    minute: "min",
    hourUnit: "h",
    cannotLoadCourse: "Cannot load course detail.",
    logout: "Logout",
  },
  de: {
    title: "KURSDETAIL",
    back: "Zurück",
    continue: "Start learning",
    reset: "Fortschritt zurücksetzen",
    loading: "Lade Daten...",
    lessonList: "Kursinhalt",
    progress: "Fortschritt",
    objective: "Lernziele",
    audience: "Zielgruppe",
    benefits: "Vorteile",
    noLesson: "Noch keine Lektionen.",
    reviewTitle: "Kursbewertung",
    reviewDone: "Sie haben bereits bewertet.",
    reviewOnce: "Eine Bewertung pro Kurs.",
    submit: "Bewerten",
    continueLesson: "Player",
    noModule: "Noch keine Module/Videos.",
    completeModule: "Als erledigt markieren",
    watched: "Angesehen",
    descCourse: "Kursbeschreibung",
    descLesson: "Lektionsbeschreibung",
    descModule: "Modulbeschreibung",
    defaultCourseSummary: "Player + Lehrplan + Quiz + Aufgaben.",
    beginner: "Anfänger",
    lessonLabel: "Lektion",
    noLessonDescription: "Keine Beschreibung.",
    noComment: "(Kein Kommentar)",
    reviewPlaceholder: "Teilen Sie Ihr Feedback...",
    toastNotice: "Hinweis",
    toastNoLesson: "Keine Lektion zum Starten verfügbar.",
    toastSuccess: "Erfolg",
    toastResetSuccess: "Der Kursfortschritt wurde zurückgesetzt.",
    toastError: "Fehler",
    toastResetFail: "Kursfortschritt konnte nicht zurückgesetzt werden.",
    toastReviewSuccess: "Kursbewertung gesendet.",
    courseFallback: "Kurs",
    minute: "Min",
    hourUnit: "Std",
    cannotLoadCourse: "Kursdetails können nicht geladen werden.",
    logout: "Abmelden",
  },
};

function sortLessons(ls: ApiLesson[]) {
  return [...ls].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
}

function reviewStorageKey(courseId: number) {
  return `student_course_review_${courseId}`;
}

export function StudentCourseDetailPage() {
  const nav = useNavigate();
  const { logout } = useAuth();
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const { toast } = useToast();

  const courseId = Number(id || 0);
  const lang = normalizeLang(sp.get("lang"));
  const lessonIdFromQuery = Number(sp.get("lessonId") || 0);
  const t = i18n[lang];

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [course, setCourse] = useState<ApiCourseDetail | null>(null);
  const [lessons, setLessons] = useState<ApiLesson[]>([]);
  const [progress, setProgress] = useState<ApiCourseProgress | null>(null);
  const [reviews, setReviews] = useState<ApiCourseReview[]>([]);
  const [activeLesson, setActiveLesson] = useState<ApiLessonDetail | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [myReview, setMyReview] = useState<RatingState | null>(null);
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({});
  const [isResetting, setIsResetting] = useState(false);

  function buildDefaultOpenModules(lesson: ApiLessonDetail | null) {
    if (!lesson?.modules?.length) return {};
    const [firstModule] = lesson.modules;
    return firstModule ? { [firstModule.id]: true } : {};
  }

  async function loadData(targetLessonId?: number) {
    if (!courseId) return;
    setLoading(true);
    setErr(null);
    try {
      const [courseData, progressData, lessonRows, reviewRows] = await Promise.all([
        studentApi.courseDetail(courseId, lang),
        studentApi.courseProgress(courseId),
        studentApi.courseLessons(courseId, lang),
        studentApi.courseReviews(courseId),
      ]);
      const sortedLessons = sortLessons(lessonRows);
      const fallbackLessonId = sortedLessons[Math.min(progressData.completedLessons ?? 0, Math.max(0, sortedLessons.length - 1))]?.id;
      const selectedLessonId = targetLessonId || lessonIdFromQuery || fallbackLessonId || sortedLessons[0]?.id;

      setCourse(courseData);
      setProgress(progressData);
      setLessons(sortedLessons);
      setReviews(reviewRows);

      if (selectedLessonId) {
        const lessonDetail = await studentApi.lessonDetail(selectedLessonId, lang);
        setActiveLesson(lessonDetail);
        setOpenModules(buildDefaultOpenModules(lessonDetail));
      } else {
        setActiveLesson(null);
        setOpenModules({});
      }
    } catch (e: any) {
      setErr(e?.message || t.cannotLoadCourse);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData(lessonIdFromQuery || undefined);
    const raw = localStorage.getItem(reviewStorageKey(courseId));
    setMyReview(raw ? (JSON.parse(raw) as RatingState) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lang, lessonIdFromQuery]);

  async function openLesson(lessonId: number) {
    const next = new URLSearchParams(sp);
    next.set("lessonId", String(lessonId));
    setSp(next);
    const lessonDetail = await studentApi.lessonDetail(lessonId, lang);
    setActiveLesson(lessonDetail);
    setOpenModules(buildDefaultOpenModules(lessonDetail));
  }

  function changeLang(nextLang: Lang) {
    const next = new URLSearchParams(sp);
    next.set("lang", nextLang);
    setSp(next);
  }

  function handleLogout() {
    logout();
    nav("/admin/login", { replace: true });
  }

  async function markVideoDone(video: ApiLessonVideo) {
    if (!activeLesson) return;
    await studentApi.updateVideoProgress(activeLesson.id, video.id, video.durationSec || 0, true);
    await loadData(activeLesson.id);
  }

  async function startLearning() {
    if (!activeLesson?.id) {
      toast(t.toastNotice, t.toastNoLesson);
      return;
    }
    nav(`/student/lessons/${activeLesson.id}?courseId=${courseId}&lang=${lang}`);
  }

  async function resetProgress() {
    if (!lessons.length) return;
    setIsResetting(true);
    try {
      for (const lesson of lessons) {
        const lessonDetail = await studentApi.lessonDetail(lesson.id, lang);
        for (const module of lessonDetail.modules || []) {
          for (const video of module.videos || []) {
            await studentApi.updateVideoProgress(lesson.id, video.id, 0, false);
          }
        }
      }
      await loadData(activeLesson?.id);
      toast(t.toastSuccess, t.toastResetSuccess);
    } catch (e: any) {
      toast(t.toastError, e?.message || t.toastResetFail);
    } finally {
      setIsResetting(false);
    }
  }

  function submitReview() {
    if (myReview) return;
    const payload: RatingState = { stars: rating, comment: comment.trim(), createdAt: new Date().toISOString() };
    localStorage.setItem(reviewStorageKey(courseId), JSON.stringify(payload));
    setMyReview(payload);
    toast(t.toastSuccess, t.toastReviewSuccess);
  }

  const lessonProgressPercent = useMemo(() => {
    if (!activeLesson?.modules?.length) return 0;
    const done = activeLesson.modules.filter((m) => m.progress?.completed).length;
    return Math.round((done / activeLesson.modules.length) * 100);
  }, [activeLesson]);

  const ratingAvgFromReviews = useMemo(() => {
    if (!reviews.length) return Number(course?.ratingAvg || 0);
    const total = reviews.reduce((sum, item) => sum + (Number(item.stars) || 0), 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews, course?.ratingAvg]);

  const displayStudyTime = useMemo(() => {
    const raw = String(course?.time || "").trim();
    const parsed = Number(raw.replace(",", ".").replace(/[^0-9.]/g, ""));

    if (Number.isFinite(parsed) && parsed > 0) {
      return `${parsed % 1 === 0 ? parsed.toFixed(0) : parsed.toFixed(1)} ${t.hourUnit}`;
    }

    return `0 ${t.hourUnit}`;
  }, [course?.time, t.hourUnit]);

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "radial-gradient(900px 420px at 10% 0%, rgba(79,70,229,0.14), transparent 60%), radial-gradient(700px 380px at 95% 10%, rgba(14,165,233,0.14), transparent 60%), linear-gradient(to bottom, #f8fafc, #eef2ff)" }}>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1300px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button className="btn" onClick={() => nav("/student")}>← {t.back}</button>
            <div className="text-sm font-bold text-slate-700">{course?.title || `${t.courseFallback} #${courseId}`}</div>
          </div>
          <button className="btn" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket mr-1" />{t.logout}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1300px] space-y-5 px-4 pb-6 pt-24 md:px-8">
        <section className="rounded-[20px] border border-white/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1.6fr]">
            <div className="relative overflow-hidden rounded-2xl">
              <img className="h-[220px] w-full rounded-2xl object-cover" src={course?.thumbnail || "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop"} alt={course?.title || "thumbnail"} />
              <div className="absolute bottom-3 left-3 flex gap-2 text-xs font-bold">
                <span className="rounded-xl bg-white/90 px-2 py-1">⭐ {ratingAvgFromReviews}</span>
                <span className="rounded-xl bg-white/90 px-2 py-1">⏱ {displayStudyTime}</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-500">{t.title}</div>
              <h1 className="text-4xl font-black leading-tight">{course?.title || `${t.courseFallback} #${courseId}`}</h1>
              <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-black ring-1 ring-slate-200">{course?.shortDescription || course?.description || t.defaultCourseSummary}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
                <span className="rounded-xl bg-amber-100 px-3 py-1 text-amber-700">💰 {course?.price?.toLocaleString("vi-VN") || 0}</span>
                <span className="rounded-xl bg-blue-100 px-3 py-1 text-blue-700">📘 {t.beginner}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn" onClick={() => void resetProgress()} disabled={isResetting}><i className="fa-solid fa-rotate-right mr-1" />{isResetting ? `${t.reset}...` : t.reset}</button>
                <button className="btn btn-primary" onClick={() => void startLearning()}><i className="fa-solid fa-play mr-1" />{t.continue}</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableLangs.map((langOption) => (
                  <button
                    key={langOption}
                    className={`btn ${lang === langOption ? "btn-primary" : ""}`}
                    onClick={() => changeLang(langOption)}
                    type="button"
                  >
                    {langOption.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {loading && <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">{t.loading}</div>}
        {err && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{err}</div>}

        <section className="grid gap-4 xl:grid-cols-[1.75fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-[20px] border border-white/80 bg-white/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-black">{t.continueLesson}: {activeLesson?.localizedTitle || activeLesson?.title || "-"}</h2>
                <span className="chip">{lessonProgressPercent}%</span>
              </div>
              <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-black ring-1 ring-slate-200"><b>{t.descLesson}:</b> {activeLesson?.localizedDescription || activeLesson?.description || "-"}</div>
              {activeLesson?.modules?.map((m) => {
                const isOpen = openModules[m.id] ?? false;
                const isModuleDone = Boolean(m.progress?.completed) || Boolean(m.videos?.length && m.videos.every((video) => video.progress?.completed));
                return (
                  <div key={m.id} className="relative mb-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <span className="absolute left-3 top-3 inline-flex h-3 w-3 rounded-full border-2 border-violet-200 bg-violet-400" />
                    <span className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ${isModuleDone ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-amber-100 text-amber-700 ring-amber-200"}`}>
                      <i className={`fa-solid ${isModuleDone ? "fa-check" : "fa-clock"}`} />
                    </span>
                    <div className="ml-5 space-y-2">
                      <div className="flex items-start justify-between gap-2 pr-10">
                        <div className="font-bold">{m.localizedTitle || m.title}</div>
                        <div className="flex items-center gap-2">
                          <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200" onClick={() => setOpenModules((prev) => ({ ...prev, [m.id]: !isOpen }))}>
                            <i className={`fa-solid ${isOpen ? "fa-chevron-up" : "fa-chevron-down"}`} />
                          </button>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white px-2 py-2 text-sm text-black ring-1 ring-slate-200"><b>{t.descModule}:</b> {m.localizedDescription || m.description || "-"}</div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 ml-5 space-y-2">
                        {m.videos?.map((v) => (
                          <div key={v.id} className="rounded-xl bg-white p-2 ring-1 ring-slate-200">
                            <div className="text-sm font-semibold">{v.localizedTitle || v.title}</div>
                            <div className="mt-1 text-sm text-slate-700">{v.localizedDescription || v.description || "-"}</div>
                            {v.playbackUrl ? <video className="mt-2 w-full rounded-lg border border-slate-200" controls src={v.playbackUrl} onEnded={() => void markVideoDone(v)} /> : null}
                            <div className="mt-2 text-right">
                              <button className="btn" onClick={() => void markVideoDone(v)}>{t.watched} {v.progress?.completed ? "✓" : ""}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {!activeLesson?.modules?.length && <div className="text-sm text-slate-500">{t.noModule}</div>}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><h3 className="font-bold">{t.objective}</h3><ul className="mt-2 list-disc pl-4 text-sm text-black">{(course?.objectives || []).map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul></div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><h3 className="font-bold">{t.audience}</h3><ul className="mt-2 list-disc pl-4 text-sm text-black">{(course?.targetAudience || []).map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul></div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><h3 className="font-bold">{t.benefits}</h3><ul className="mt-2 list-disc pl-4 text-sm text-black">{(course?.benefits || []).map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[20px] border border-white/80 bg-white/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-black">{t.lessonList}</h3>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-600"><span>{t.progress}</span><b>{progress?.percent || 0}%</b></div>
              <div className="mt-2 h-[8px] overflow-hidden rounded-full bg-indigo-100"><div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${progress?.percent || 0}%` }} /></div>
              <div className="mt-3 space-y-2">
                {lessons.map((lesson, idx) => {
                  const isDone = (lesson.progress?.percent || 0) >= 100;
                  return (
                    <button key={lesson.id} className={`relative w-full rounded-xl px-3 py-2 text-left ring-1 ${activeLesson?.id === lesson.id ? "bg-indigo-50 ring-indigo-200" : "bg-slate-50 ring-slate-200"}`} onClick={() => void openLesson(lesson.id)}>
                      <span className="absolute left-2 top-2 inline-flex h-3 w-3 rounded-full border-2 border-sky-200 bg-sky-400" />
                      <span className={`absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ${isDone ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-amber-100 text-amber-700 ring-amber-200"}`}>
                        <i className={`fa-solid ${isDone ? "fa-check" : "fa-clock"}`} />
                      </span>
                      <div className="ml-4 pr-9">
                        <div>
                          <div className="text-xs text-slate-500">{t.lessonLabel} {idx + 1}</div>
                          <div className="font-semibold">{lesson.localizedTitle || lesson.title}</div>
                          <div className="mt-1 rounded-lg bg-white px-2 py-1 text-xs text-black ring-1 ring-slate-200" style={clamp2}>{lesson.localizedDescription || lesson.description || t.noLessonDescription}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {!lessons.length && <div className="text-sm text-slate-500">{t.noLesson}</div>}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/80 bg-white/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-black">{t.reviewTitle}</h3>
              {myReview ? (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
                  <div>{t.reviewDone}</div>
                  <div className="mt-1">⭐ {myReview.stars}/5 • {myReview.comment || t.noComment}</div>
                </div>
              ) : (
                <>
                  <div className="mt-2 text-xs text-slate-500">{t.reviewOnce}</div>
                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} className={`h-9 w-9 rounded-lg ring-1 ${rating >= star ? "bg-amber-100 text-amber-700 ring-amber-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`} onClick={() => setRating(star)}>
                        <i className="fa-solid fa-star" />
                      </button>
                    ))}
                  </div>
                  <textarea className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300" rows={3} placeholder={t.reviewPlaceholder} value={comment} onChange={(e) => setComment(e.target.value)} />
                  <button className="btn btn-primary mt-3 w-full" onClick={submitReview}>{t.submit}</button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
