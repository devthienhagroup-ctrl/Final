// src/pages/instructor/InstructorDashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../ui/toast";
import type { Course } from "../instructor/instructor.types";
import { MOCK_COURSES } from "../instructor/instructor.mock";
import { LessonModal, type LessonDraftPayload } from "../components/LessonModal";
import { InstructorHeader } from "../components/InstructorHeader";
import { KpiGrid } from "../components/KpiGrid";
import { CoursesGrid } from "../components/CoursesGrid";
import { QuickActions } from "../components/QuickActions";


type StatusFilter = "ALL" | "PUBLISHED" | "DRAFT";

export function InstructorDashboardPage() {
  const { toast } = useToast();

  // ====== STATE (prototype) ======
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("PUBLISHED");

  const [courses] = useState<Course[]>(MOCK_COURSES);

  // Modal
  const [lessonOpen, setLessonOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [lessonModalKey, setLessonModalKey] = useState(0); // remount to reset form

  // ====== DERIVED ======
  const filteredCourses = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return courses.filter((c) => {
      const okQ = !kw || c.title.toLowerCase().includes(kw);
      const okS = filter === "ALL" || c.status === filter;
      return okQ && okS;
    });
  }, [courses, q, filter]);

  const kpis = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.status === "PUBLISHED").length;
    const students = courses.reduce((a, b) => a + b.students, 0);
    const drafts = courses.reduce((a, b) => a + b.drafts, 0);
    return {
      managedCourses: total,
      publishedCourses: published,
      students,
      draftLessons: drafts,
      ratingAvg: 4.7,
    };
  }, [courses]);

  // ====== ACTIONS ======
  function openLessonModal(courseId: number) {
    setActiveCourseId(courseId);
    setLessonModalKey((k) => k + 1); // reset form on open without useEffect setState warnings
    setLessonOpen(true);
  }
  function closeLessonModal() {
    setLessonOpen(false);
  }

  function onSaveDraft(payload: LessonDraftPayload) {
    // TODO API:
    // POST /courses/:courseId/lessons  (draft)
    // body: { title, type, content, status:"DRAFT" }
    toast("Lưu draft", `Course#${payload.courseId} • Draft saved (prototype)`);
    closeLessonModal();
  }

  function onPublish(payload: LessonDraftPayload) {
    // TODO API:
    // POST /courses/:courseId/lessons  (publish)
    // hoặc POST /lessons/:id/publish tùy thiết kế
    // RBAC: lessons.publish + courses.write
    toast("Publish bài học", `Course#${payload.courseId} • Published (prototype)`);
    closeLessonModal();
  }

  // ====== SHORTCUTS ======
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "/" && !typing) {
        e.preventDefault();
        const el = document.getElementById("instructor-search");
        (el as HTMLInputElement | null)?.focus();
        return;
      }
      if (e.key === "Escape") {
        setLessonOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background:
          "radial-gradient(900px 450px at 15% 0%, rgba(79,70,229,0.14), transparent 60%), radial-gradient(700px 380px at 90% 10%, rgba(245,158,11,0.10), transparent 60%), linear-gradient(to bottom, #f8fafc, #f8fafc)",
      }}
    >
      <InstructorHeader
        onOpenStudent={() => toast("Học viên", "Đi tới Student Portal (prototype)")}
        onOpenRbac={() => toast("RBAC", "Đi tới RBAC Settings (prototype)")}
        onNotif={() => toast("Thông báo", "Prototype: mở notification center (sẽ làm ở React).")}
        onNewCourse={() => {
          // TODO API: POST /courses (instructor)
          toast("Tạo khoá học", "React/Nest: POST /courses");
        }}
      />

      <main className="px-4 md:px-8 py-6 space-y-6">
        <KpiGrid kpis={kpis} />

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Khoá học</div>
                <div className="text-lg font-extrabold">Quản lý nội dung</div>
                <div className="mt-1 text-sm text-slate-600">
                  Prototype: tạo lesson draft/publish, quản lý syllabus.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="instructor-search"
                    className="rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 pl-11 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300"
                    placeholder="Tìm khoá... (phím /)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                <select
                  className="rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as StatusFilter)}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PUBLISHED">Đang bán</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <CoursesGrid
                courses={filteredCourses}
                onAddLesson={(courseId) => openLessonModal(courseId)}
                onManageCourse={(courseId) =>
                  toast("Quản lý khoá", `React/Nest: GET /courses/${courseId} + /lessons`)
                }
              />
            </div>
          </div>

          <QuickActions
            onPublish={() => toast("Publish", "RBAC: lessons.publish + courses.write")}
            onPreview={() => toast("Preview", "Prototype: preview landing/course page")}
            onCoupon={() => toast("Coupon", "Prototype: tạo voucher giảm giá theo khoá")}
            onSyllabus={() => toast("Syllabus", "Prototype: kéo thả thứ tự bài học")}
          />
        </section>

        <footer className="py-6 text-center text-sm text-slate-500">
          © 2025 AYANAVITA • Instructor Dashboard (React Prototype)
        </footer>
      </main>

      <LessonModal
        key={lessonModalKey}
        open={lessonOpen}
        courseId={activeCourseId}
        onClose={closeLessonModal}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
      />
    </div>
  );
}