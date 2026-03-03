import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../app/auth";

export function StudentLessonPlayerPage() {
  const nav = useNavigate();
  const { logout } = useAuth();
  const { id } = useParams();
  const [sp] = useSearchParams();
  const courseId = sp.get("courseId");
  const lang = sp.get("lang") || "vi";

  function handleLogout() {
    logout();
    nav("/login", { replace: true });
  }

  useEffect(() => {
    if (!courseId || !id) {
      nav("/student", { replace: true });
      return;
    }
    nav(`/student/courses${courseId}?lessonId=${id}&lang=${lang}`, { replace: true });
  }, [courseId, id, lang, nav]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1300px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button className="btn" onClick={() => nav("/student")}>← Quay lại</button>
            <div className="text-sm font-bold text-slate-700">Student Lesson Player</div>
          </div>
          <button className="btn" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket mr-1" />Đăng xuất
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1300px] px-4 pt-24 md:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Đang chuyển đến bài học...
        </div>
      </main>
    </div>
  );
}
