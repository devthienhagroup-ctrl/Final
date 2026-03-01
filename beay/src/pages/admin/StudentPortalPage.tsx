// src/pages/student/StudentPortalPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../ui/toast";
import type { StudentCourse, StudyPlanItem } from "../student/student.types";
import { loadPlan, savePlan } from "../student/student.storage";
import { DEFAULT_PLAN, MOCK_STUDENT_COURSES } from "../student/student.mock";
import { StudentHeader } from "../components/StudentHeader";
import { StudentHero } from "../components/StudentHero";
import { StudentCourses } from "../components/StudentCourses";
import { StudyPlan } from "../components/StudyPlan";
import { CertificatesPanel } from "../components/CertificatesPanel";
import { SupportPanel } from "../components/SupportPanel";


const LS_KEY_PLAN = "aya_student_plan";

export function StudentPortalPage() {
  const { toast } = useToast();

  // ====== Data (prototype) ======
  const [courses] = useState<StudentCourse[]>(MOCK_STUDENT_COURSES);

  const [plan, setPlan] = useState<StudyPlanItem[]>(() =>
    loadPlan(LS_KEY_PLAN, DEFAULT_PLAN)
  );

  // Base streak is the "5 ngày" from HTML; we add done count
  const streak = useMemo(() => {
    const done = plan.filter((x) => x.done).length;
    return 5 + done;
  }, [plan]);

  useEffect(() => {
    savePlan(LS_KEY_PLAN, plan);
  }, [plan]);

  function togglePlan(id: string, done: boolean) {
    setPlan((prev) => prev.map((x) => (x.id === id ? { ...x, done } : x)));
  }

  // ====== Actions (prototype → API notes) ======
  const actions = {
    bell: () => toast("Thông báo", "Prototype: notifications list."),
    continue: () => toast("Tiếp tục học", "Prototype: mở lesson đang học dở."),
    enterLesson: () => toast("Vào học", "Prototype: lesson detail + progress."),
    bookmark: () => toast("Đã lưu", "Bookmark bài học."),
    findCourse: () => toast("Tìm khoá", "Prototype: course catalog + order."),
    remind: () => toast("Nhắc học", "Prototype: bật lịch nhắc theo tuần."),
    downloadAll: () => toast("Tải chứng chỉ", "Prototype: zip/pdf export."),
    pdf: () => toast("PDF", "Prototype: download certificate."),
    share: () => toast("Chia sẻ", "Prototype: share to LinkedIn."),
    req: () => toast("Yêu cầu chứng chỉ", "Hoàn thành quiz + đủ % bài học."),
    faq: () => toast("FAQ", "Prototype: mở trang hướng dẫn."),
    ticket: () => toast("Ticket", "Prototype: tạo ticket hỗ trợ."),
    chat: () => toast("Chat CSKH", "Prototype: chat widget."),
  };

  // ====== API connection notes (backend AYANAVITA) ======
  // - "Khóa học đang tham gia": GET /me/courses
  // - "Tiến độ": GET /me/progress hoặc GET /me/courses/:courseId/progress
  // - "Vào học": lessonsApi.getLesson + progressApi.postProgress/postComplete
  // - Rule: Lesson/Progress chỉ khi Enrollment ACTIVE (Admin bypass)

  useEffect(() => {
    toast("Student Portal", "Đã nâng cấp: tick plan (local), actions demo, streak update.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background:
          "radial-gradient(900px 450px at 15% 0%, rgba(79,70,229,0.14), transparent 60%), radial-gradient(700px 380px at 90% 10%, rgba(245,158,11,0.10), transparent 60%), linear-gradient(to bottom, #f8fafc, #f8fafc)",
      }}
    >
      <StudentHeader onBell={actions.bell} onContinue={actions.continue} />

      <main className="px-4 md:px-8 py-6 space-y-6">
        <StudentHero
          name="Minh Anh"
          streakDays={streak}
          onEnterLesson={actions.enterLesson}
          onBookmark={actions.bookmark}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          <StudentCourses courses={courses} onFindCourse={actions.findCourse} />
          <StudyPlan plan={plan} onToggle={togglePlan} streakDays={streak} onRemind={actions.remind} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <CertificatesPanel
            onDownloadAll={actions.downloadAll}
            onPdf={actions.pdf}
            onShare={actions.share}
            onReq={actions.req}
          />
          <SupportPanel onFaq={actions.faq} onTicket={actions.ticket} onChat={actions.chat} />
        </section>

        <footer className="py-6 text-center text-sm text-slate-500">
          © 2025 AYANAVITA • Student Portal (React Prototype)
        </footer>
      </main>
    </div>
  );
}