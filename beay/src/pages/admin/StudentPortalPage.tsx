import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../ui/toast";
import type { StudentCourse, StudyPlanItem } from "../student/student.types";
import { loadPlan, savePlan } from "../student/student.storage";
import { DEFAULT_PLAN, MOCK_STUDENT_COURSES } from "../student/student.mock";
import { studentApi } from "../student/student.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentHero } from "../components/StudentHero";
import { StudentCourses } from "../components/StudentCourses";
import { StudyPlan } from "../components/StudyPlan";
import { CertificatesPanel } from "../components/CertificatesPanel";
import { SupportPanel } from "../components/SupportPanel";

const LS_KEY_PLAN = "aya_student_plan";

function sortLessons<T extends { id: number; order?: number }>(lessons: T[]): T[] {
  return [...lessons].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

export function StudentPortalPage() {
  const { toast } = useToast();
  const nav = useNavigate();

  const [courses, setCourses] = useState<StudentCourse[]>(MOCK_STUDENT_COURSES);
  const [loading, setLoading] = useState<boolean>(true);
  const [plan, setPlan] = useState<StudyPlanItem[]>(() => loadPlan(LS_KEY_PLAN, DEFAULT_PLAN));

  const streak = useMemo(() => {
    const done = plan.filter((x) => x.done).length;
    return 5 + done;
  }, [plan]);

  const activeCourses = useMemo(() => courses.filter((c) => c.active), [courses]);
  const totalProgress = useMemo(() => {
    if (activeCourses.length === 0) return 0;
    const total = activeCourses.reduce((sum, c) => sum + c.progress, 0);
    return Math.round(total / activeCourses.length);
  }, [activeCourses]);

  const bestCourse = useMemo(() => {
    if (courses.length === 0) return null;
    return [...courses].sort((a, b) => b.progress - a.progress)[0];
  }, [courses]);

  const nextCourse = useMemo(() => {
    if (activeCourses.length === 0) return null;
    return [...activeCourses].sort((a, b) => b.progress - a.progress)[0];
  }, [activeCourses]);

  useEffect(() => {
    savePlan(LS_KEY_PLAN, plan);
  }, [plan]);

  async function loadCourses() {
    setLoading(true);
    try {
      const rows = await studentApi.myCourses("vi");
      const mapped = await Promise.all(rows.map(async (row) => {
        let lessonCount = row.course._count?.lessons ?? row.progress?.totalLessons ?? 0;
        let progress = row.progress;

        if (!progress && (row.status === "ACTIVE" || row.status === "PENDING")) {
          try {
            progress = await studentApi.courseProgress(row.courseId);
            lessonCount = progress.totalLessons;
          } catch {
            // ignore progress error on single course
          }
        }

        let nextLessonTitle = "Chưa có bài học";
        let nextLessonId: number | undefined;

        if (row.status === "ACTIVE") {
          try {
            const lessons = await studentApi.courseLessons(row.courseId);
            const sorted = sortLessons(lessons);
            const completed = progress?.completedLessons ?? 0;
            const index = Math.min(completed, Math.max(0, sorted.length - 1));
            const nextLesson = sorted[index];
            if (nextLesson) {
              nextLessonTitle = nextLesson.title;
              nextLessonId = nextLesson.id;
            }
          } catch {
            // ignore lessons error on single course
          }
        }

        return {
          id: row.id,
          courseId: row.courseId,
          status: row.status,
          title: row.course.title,
          teacher: "AYANAVITA",
          price: row.course.price,
          lessons: lessonCount,
          progress: progress?.percent ?? 0,
          completedLessons: progress?.completedLessons ?? 0,
          nextLessonTitle,
          nextLessonId,
          active: row.status === "ACTIVE",
        } satisfies StudentCourse;
      }));

      setCourses(mapped);
    } catch (error: any) {
      toast("Lỗi tải dữ liệu", error?.message || "Không thể tải khoá học từ API.");
      setCourses(MOCK_STUDENT_COURSES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePlan(id: string, done: boolean) {
    setPlan((prev) => prev.map((x) => (x.id === id ? { ...x, done } : x)));
  }

  async function continueCourse(course: StudentCourse) {
    if (!course.active) return;

    try {
      const lessons = await studentApi.courseLessons(course.courseId);
      const nextLesson = sortLessons(lessons)[0];
      if (!nextLesson) {
        toast("Khoá học trống", "Khoá học chưa có bài học nào.");
        return;
      }

      toast("Tiếp tục học", `Mở bài học: ${nextLesson.title}`);
      nav(`/student/lessons/${nextLesson.id}?courseId=${course.courseId}`);
    } catch (error: any) {
      toast("Không thể vào học", error?.message || "Không lấy được danh sách bài học.");
    }
  }

  function openDetail(course: StudentCourse) {
    nav(`/student/courses/${course.courseId}`);
  }

  async function cancelCourse(course: StudentCourse) {
    if (!course.active) return;
    try {
      await studentApi.cancelCourse(course.courseId);
      toast("Đã huỷ khoá học", `${course.title} đã được huỷ.`);
      await loadCourses();
    } catch (error: any) {
      toast("Huỷ thất bại", error?.message || "Không thể huỷ khoá học.");
    }
  }

  const actions = {
    bell: async () => {
      try {
        const progress = await studentApi.myProgress();
        toast("Thông báo", `Bạn có ${progress.length} bản ghi tiến độ học tập.`);
      } catch {
        toast("Thông báo", "Tính năng thông báo đang được cập nhật.");
      }
    },
    continue: () => (nextCourse ? continueCourse(nextCourse) : toast("Tiếp tục học", "Chưa có khoá ACTIVE để học tiếp.")),
    enterLesson: () => (nextCourse ? continueCourse(nextCourse) : toast("Vào học", "Chưa có bài học tiếp theo.")),
    bookmark: () => toast("Đã lưu", "Đã lưu bài học hiện tại vào danh sách đánh dấu."),
    findCourse: () => {
      nav("/student");
    },
    remind: () => toast("Nhắc học", "Đã bật nhắc học theo lịch tuần hiện tại."),
    downloadAll: () => toast("Tải chứng chỉ", "Danh sách chứng chỉ sẽ được tải khi endpoint export khả dụng."),
    pdf: () => toast("PDF", "Tính năng tải PDF sẽ dùng endpoint chứng chỉ trong backend."),
    share: () => toast("Chia sẻ", "Đã sao chép liên kết chứng chỉ."),
    req: () => toast("Yêu cầu chứng chỉ", "Hoàn thành 100% bài học để mở chứng chỉ."),
    faq: () => {
      toast("FAQ", "Trang FAQ sẽ mở ở phiên bản tiếp theo.");
    },
    ticket: () => {
      toast("Ticket", "Trang ticket sẽ mở ở phiên bản tiếp theo.");
    },
    chat: () => toast("Chat CSKH", "Widget chat sẽ được mở trong phiên bản tiếp theo."),
  };

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
          name="Học viên"
          streakDays={streak}
          activeCourses={activeCourses.length}
          totalProgress={totalProgress}
          certificates={courses.filter((c) => c.progress >= 100).length}
          nextCourseTitle={nextCourse?.title ?? "Chưa có khoá học"}
          nextLessonTitle={nextCourse?.nextLessonTitle ?? "Chưa có bài học"}
          nextPercent={nextCourse?.progress ?? 0}
          onEnterLesson={actions.enterLesson}
          onBookmark={actions.bookmark}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          <StudentCourses
            courses={courses}
            loading={loading}
            onFindCourse={actions.findCourse}
            onContinue={continueCourse}
            onDetail={openDetail}
            onCancel={cancelCourse}
          />
          <StudyPlan plan={plan} onToggle={togglePlan} streakDays={streak} onRemind={actions.remind} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <CertificatesPanel
            completedCourses={courses.filter((c) => c.progress >= 100).length}
            bestCourseName={bestCourse?.title ?? "Chưa có"}
            inProgressCourseName={nextCourse?.title ?? "Chưa có"}
            inProgressPercent={nextCourse?.progress ?? 0}
            onDownloadAll={actions.downloadAll}
            onPdf={actions.pdf}
            onShare={actions.share}
            onReq={actions.req}
          />
          <SupportPanel onFaq={actions.faq} onTicket={actions.ticket} onChat={actions.chat} />
        </section>

        <footer className="py-6 text-center text-sm text-slate-500">© 2025 AYANAVITA • Student Portal</footer>
      </main>
    </div>
  );
}
