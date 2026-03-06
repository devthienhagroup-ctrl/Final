import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../ui/toast";
import { useAuth } from "../../app/auth";
import type { StudentCourse } from "../student/student.types";
import { MOCK_STUDENT_COURSES } from "../student/student.mock";
import { studentApi } from "../student/student.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentHero } from "../components/StudentHero";
import { StudentCourses } from "../components/StudentCourses";
import { LearningOverviewChart } from "../components/LearningOverviewChart";

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
  const { logout, can } = useAuth();
  const canAccessDashboard = can("dashboard.admin");
  const nav = useNavigate();

  const [courses, setCourses] = useState<StudentCourse[]>(MOCK_STUDENT_COURSES);
  const [loading, setLoading] = useState<boolean>(true);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState({
    activeCourses: 0,
    pendingCourses: 0,
    canceledCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
  });
  const [courseToCancel, setCourseToCancel] = useState<StudentCourse | null>(null);
  const [canceling, setCanceling] = useState(false);

  const streak = useMemo(() => {
    const doneRatio = overview.totalLessons > 0 ? overview.completedLessons / overview.totalLessons : 0;
    return Math.max(5, Math.round(5 + doneRatio * 10));
  }, [overview.completedLessons, overview.totalLessons]);

  const activeCourses = useMemo(() => courses.filter((c) => c.active), [courses]);
  const totalProgress = useMemo(() => {
    if (activeCourses.length === 0) return 0;
    const total = activeCourses.reduce((sum, c) => sum + c.progress, 0);
    return Math.round(total / activeCourses.length);
  }, [activeCourses]);

  const nextCourse = useMemo(() => {
    if (activeCourses.length === 0) return null;
    return [...activeCourses].sort((a, b) => b.progress - a.progress)[0];
  }, [activeCourses]);

  async function loadCourses() {
    setLoading(true);
    try {
      const rows = await studentApi.myCourses("vi");
      const mapped = await Promise.all(
          rows.map(async (row) => {
            const canAccess = row.status === "ACTIVE" && row.canAccess !== false;
            let lessonCount = row.course._count?.lessons ?? row.progress?.totalLessons ?? 0;
            let progress = row.progress;

            if (!progress && canAccess) {
              try {
                progress = await studentApi.courseProgress(row.courseId);
                lessonCount = progress.totalLessons;
              } catch {
                // ignore progress error on single course
              }
            }

            let nextLessonTitle = "Chua co bai hoc";
            let nextLessonId: number | undefined;

            if (canAccess) {
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
            } else if (row.blockedMessage) {
              nextLessonTitle = row.blockedMessage;
            } else if (row.status === "ACTIVE") {
              nextLessonTitle = "Khoa hoc dang bi khoa, vui long nang cap hoac gia han goi.";
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
              active: canAccess,
              canAccess,
              blockedReason: row.blockedReason ?? null,
              blockedMessage: row.blockedMessage ?? null,
              upgradePlan: row.upgradePlan ?? null,
            } satisfies StudentCourse;
          }),
      );

      setCourses(mapped);
    } catch (error: any) {
      toast("Lỗi tải dữ liệu", error?.message || "Không thể tải khoá học từ API.");
      setCourses(MOCK_STUDENT_COURSES);
    } finally {
      setLoading(false);
    }
  }

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const stats = await studentApi.learningStats();
      setOverview({
        activeCourses: stats.activeCourses,
        pendingCourses: stats.pendingCourses,
        canceledCourses: stats.canceledCourses,
        totalLessons: stats.totalLessons,
        completedLessons: stats.completedLessons,
      });
    } catch {
      // fallback by aggregating existing endpoints if statistics endpoint is unavailable
      try {
        const rows = await studentApi.myCourses("vi");
        const activeCourses = rows.filter((x) => x.status === "ACTIVE").length;
        const pendingCourses = rows.filter((x) => x.status === "PENDING").length;
        const canceledCourses = rows.filter((x) => x.status === "CANCELED" || x.status === "CANCELLED").length;

        const progressRows = await Promise.all(
            rows.map(async (row) => {
              if (row.progress) return row.progress;
              try {
                return await studentApi.courseProgress(row.courseId);
              } catch {
                return null;
              }
            }),
        );

        const totals = progressRows.reduce(
            (acc, item) => {
              if (!item) return acc;
              acc.totalLessons += item.totalLessons;
              acc.completedLessons += item.completedLessons;
              return acc;
            },
            { totalLessons: 0, completedLessons: 0 },
        );

        setOverview({
          activeCourses,
          pendingCourses,
          canceledCourses,
          totalLessons: totals.totalLessons,
          completedLessons: totals.completedLessons,
        });
      } catch {
        setOverview({
          activeCourses: activeCourses.length,
          pendingCourses: courses.filter((x) => x.status === "PENDING").length,
          canceledCourses: courses.filter((x) => x.status === "CANCELED" || x.status === "CANCELLED").length,
          totalLessons: courses.reduce((sum, c) => sum + c.lessons, 0),
          completedLessons: courses.reduce((sum, c) => sum + c.completedLessons, 0),
        });
      }
    } finally {
      setOverviewLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function continueCourse(course: StudentCourse) {
    if (!course.canAccess) {
      toast("Khong the vao hoc", course.blockedMessage || "Khoa hoc nay dang bi khoa. Vui long nang cap hoac gia han goi.");
      return;
    }

    if (!course.active) return;

    try {
      const lessons = await studentApi.courseLessons(course.courseId);
      const nextLesson = sortLessons(lessons)[0];
      if (!nextLesson) {
        toast("Khoá học trống", "Khoá học chưa có bài học nào.");
        return;
      }

      toast("Tiếp tục học", `Mở bài học: ${nextLesson.title}`);
      nav(`/student/courses/${course.courseId}?lessonId=${nextLesson.id}&lang=vi`);
    } catch (error: any) {
      toast("Không thể vào học", error?.message || "Không lấy được danh sách bài học.");
    }
  }
  function openDetail(course: StudentCourse) {
    if (!course.canAccess) {
      toast("Can nang cap goi", course.blockedMessage || "Khoa hoc nay dang bi khoa. Vui long nang cap hoac gia han goi.");
      return;
    }

    nav(`/student/courses/${course.courseId}`);
  }
  function cancelCourse(course: StudentCourse) {
    if (!course.active) return;
    setCourseToCancel(course);
  }

  async function confirmCancelCourse() {
    if (!courseToCancel || canceling) return;

    setCanceling(true);
    try {
      await studentApi.cancelCourse(courseToCancel.courseId);
      toast("Đã huỷ khoá học", `${courseToCancel.title} đã được huỷ.`);
      setCourseToCancel(null);
      await Promise.all([loadCourses(), loadOverview()]);
    } catch (error: any) {
      toast("Huỷ thất bại", error?.message || "Không thể huỷ khoá học.");
    } finally {
      setCanceling(false);
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
  };

  return (
      <div
          className="min-h-screen text-slate-900"
          style={{
            background:
                "radial-gradient(900px 450px at 15% 0%, rgba(79,70,229,0.14), transparent 60%), radial-gradient(700px 380px at 90% 10%, rgba(245,158,11,0.10), transparent 60%), linear-gradient(to bottom, #f8fafc, #f8fafc)",
          }}
      >

        <main className="px-4 md:px-8 py-6 space-y-6">
          < StudentHero
              name="Học viên"
              streakDays={streak}
              activeCourses={activeCourses.length}
              totalProgress={totalProgress}
              completedLessons={overview.completedLessons}
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
            <LearningOverviewChart
                loading={overviewLoading}
                activeCourses={overview.activeCourses}
                pendingCourses={overview.pendingCourses}
                canceledCourses={overview.canceledCourses}
                completedLessons={overview.completedLessons}
                remainingLessons={Math.max(overview.totalLessons - overview.completedLessons, 0)}
            />
          </section>

          <footer className="py-6 text-center text-sm text-slate-500">© 2025 AYANAVITA • Student Portal</footer>
        </main>

        {courseToCancel ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Xác nhận huỷ khoá học</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Bạn có chắc muốn huỷ khoá học <span className="font-medium text-slate-900">{courseToCancel.title}</span> không?
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
                    Sau khi huỷ, bạn có thể mất quyền truy cập vào tiến độ học của khoá này.
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => setCourseToCancel(null)}
                      disabled={canceling}
                  >
                    Đóng
                  </button>
                  <button
                      type="button"
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={confirmCancelCourse}
                      disabled={canceling}
                  >
                    {canceling ? "Đang huỷ..." : "Xác nhận huỷ"}
                  </button>
                </div>
              </div>
            </div>
        ) : null}
      </div>
  );
}

