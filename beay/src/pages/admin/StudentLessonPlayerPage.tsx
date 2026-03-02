import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export function StudentLessonPlayerPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const [sp] = useSearchParams();
  const courseId = sp.get("courseId");
  const lang = sp.get("lang") || "vi";

  useEffect(() => {
    if (!courseId || !id) {
      nav("/student", { replace: true });
      return;
    }
    nav(`/student/courses/${courseId}?lessonId=${id}&lang=${lang}`, { replace: true });
  }, [courseId, id, lang, nav]);

  return null;
}
