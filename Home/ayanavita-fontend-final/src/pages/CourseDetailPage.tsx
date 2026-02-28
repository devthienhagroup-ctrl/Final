import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import { SiteHeader } from "../components/layout/SiteHeader";
import { Footer } from "../components/layout/Footer";

type ModuleItem = { id: number; order: number; title: string };
type LessonItem = { id: number; order: number; title: string; modules: ModuleItem[] };
type ReviewItem = {
  id: number;
  stars: number;
  comment?: string | null;
  customerName?: string | null;
  createdAt: string;
};

type CourseDetail = {
  id: number;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  time?: string | null;
  thumbnail?: string | null;
  price: number;
  ratingAvg: number;
  ratingCount: number;
  enrollmentCount: number;
  topic?: { id: number; name: string } | null;
  lessons: LessonItem[];
  reviews: ReviewItem[];
};

const money = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const formatHour = (value?: string | null) => {
  if (!value) return "-";
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n) && n > 0) return `${n} Hour`;
  return `${value} Hour`;
};

const COURSE_THUMBNAIL_FALLBACK =
  "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1600&q=80";

export default function CourseDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const nav = useNavigate();

  const [lang, setLang] = useState(() => localStorage.getItem("preferred-language") || "vi");
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: string }>;
      if (customEvent.detail?.language) setLang(customEvent.detail.language);
    };
    window.addEventListener("languageChange", onLangChange as EventListener);
    return () => window.removeEventListener("languageChange", onLangChange as EventListener);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;

    (async () => {
      setLoading(true);
      try {
        const res = await http.get(`/public/courses/slug/${encodeURIComponent(slug)}`, { params: { lang } });
        if (!cancelled) setCourse(res.data);
      } catch {
        if (!cancelled) setCourse(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  const totalModules = useMemo(
    () => (course?.lessons || []).reduce((sum, lesson) => sum + lesson.modules.length, 0),
    [course?.lessons],
  );

  const thumbnail = course?.thumbnail || COURSE_THUMBNAIL_FALLBACK;

  return (
    <div className="text-slate-900">
      <SiteHeader />
      <main className="px-4 py-8">
        <div className="max-w-6xl mx-auto grid gap-4">
          <button className="btn w-fit" type="button" onClick={() => nav("/courses")}>← Khóa học</button>

          {loading ? (
            <div className="card p-8">Đang tải...</div>
          ) : !course ? (
            <div className="card p-8">Không tìm thấy khóa học.</div>
          ) : (
            <section className="grid gap-4 lg:grid-cols-10">
              <div className="lg:col-span-7 grid gap-4">
                <article className="card p-6">
                  <div className="chip w-fit">{course.topic?.name || "Course"}</div>
                  <h1 className="text-3xl font-extrabold mt-3">{course.title}</h1>
                  <p className="text-slate-700 mt-2">{course.shortDescription || course.description}</p>
                </article>

                <article className="card p-6">
                  <h2 className="text-xl font-extrabold">Nội dung khóa học</h2>
                  <p className="text-sm text-slate-600 mt-1">{course.lessons.length} bài học • {totalModules} module</p>

                  <div className="mt-4 grid gap-3">
                    {course.lessons.map((lesson) => (
                      <article key={lesson.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="font-extrabold">Bài {lesson.order + 1}: {lesson.title}</div>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                          {lesson.modules.map((module) => (
                            <li key={module.id}>• Module {module.order + 1}: {module.title}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </article>
              </div>

              <aside className="lg:col-span-3 grid gap-4">
                <article className="card overflow-hidden">
                  <img src={thumbnail} alt={course.title} className="w-full h-48 object-cover" />
                  <div className="p-4 text-xs text-slate-500">Thumbnail khóa học</div>
                </article>

                <article className="card p-5">
                  <div className="text-2xl font-extrabold text-indigo-700">{money(course.price)}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span className="chip">⏱ {formatHour(course.time)}</span>
                    <span className="chip">⭐ {course.ratingAvg.toFixed(1)} ({course.ratingCount})</span>
                    <span className="chip">👥 {course.enrollmentCount}</span>
                  </div>
                  <button
                    className="btn btn-primary w-full mt-4"
                    type="button"
                    onClick={() => window.alert("Đăng ký khóa học thành công (demo).")}
                  >
                    Đăng ký
                  </button>
                </article>

                <article className="card p-5">
                  <h2 className="text-lg font-extrabold">Đánh giá khóa học</h2>
                  <div className="mt-3 grid gap-3">
                    {course.reviews.length ? (
                      course.reviews.slice(0, 3).map((review) => (
                        <article key={review.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <div className="font-bold">{review.customerName || "Học viên"}</div>
                          <div className="text-sm text-amber-600">
                            {"★".repeat(Math.max(1, Math.min(5, review.stars)))}
                          </div>
                          <div className="text-sm text-slate-700 mt-1">{review.comment || "-"}</div>
                        </article>
                      ))
                    ) : (
                      <div className="text-sm text-slate-600">Chưa có đánh giá.</div>
                    )}
                  </div>
                </article>
              </aside>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
