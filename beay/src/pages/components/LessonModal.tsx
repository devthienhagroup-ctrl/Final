// src/pages/instructor/components/LessonModal.tsx
import { useMemo, useState } from "react";

export type LessonDraftPayload = {
  courseId: number;
  title: string;
  type: "Video" | "Text" | "Quiz" | "Live";
  status: "DRAFT" | "PUBLISH";
  content: string;
};

type Props = {
  open: boolean;
  courseId: number | null;
  onClose: () => void;
  onSaveDraft: (payload: LessonDraftPayload) => void;
  onPublish: (payload: LessonDraftPayload) => void;
};

export function LessonModal(props: Props) {
  const courseId = props.courseId ?? 0;

  const [title, setTitle] = useState("");
  const [type, setType] = useState<LessonDraftPayload["type"]>("Video");
  const [status, setStatus] = useState<LessonDraftPayload["status"]>("DRAFT");
  const [content, setContent] = useState("");

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  if (!props.open) return null;

  function close() {
    props.onClose();
  }

  function payload(): LessonDraftPayload {
    return { courseId, title: title.trim(), type, status, content };
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={close} />
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] w-full max-w-3xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold text-slate-500">Bài học</div>
              <div className="text-lg font-extrabold">Tạo bài học</div>
            </div>
            <button className="btn h-10 w-10 p-0 rounded-2xl" onClick={close}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="text-xs font-extrabold text-slate-500">Tiêu đề bài</div>
              <input
                className="rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 w-full mt-2 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300"
                placeholder="Nhập tiêu đề..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <div className="text-xs font-extrabold text-slate-500">Loại nội dung</div>
              <select
                className="rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 w-full mt-2 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300"
                value={type}
                onChange={(e) => setType(e.target.value as LessonDraftPayload["type"])}
              >
                <option>Video</option>
                <option>Text</option>
                <option>Quiz</option>
                <option>Live</option>
              </select>
            </div>

            <div>
              <div className="text-xs font-extrabold text-slate-500">Trạng thái</div>
              <select
                className="rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 w-full mt-2 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300"
                value={status}
                onChange={(e) => setStatus(e.target.value as LessonDraftPayload["status"])}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISH">Publish</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-extrabold text-slate-500">Nội dung (prototype)</div>
              <textarea
                className="rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 w-full mt-2 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300"
                rows={6}
                placeholder="Nhập nội dung / link video..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button className="btn" onClick={close}>
              Đóng
            </button>

            <button
              className="btn btn-primary"
              disabled={!canSubmit}
              style={!canSubmit ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              onClick={() => props.onSaveDraft({ ...payload(), status: "DRAFT" })}
            >
              Lưu Draft
            </button>

            <button
              className="btn btn-accent"
              disabled={!canSubmit}
              style={!canSubmit ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              onClick={() => props.onPublish({ ...payload(), status: "PUBLISH" })}
            >
              Publish
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            API note: POST <b>/courses/:courseId/lessons</b> (draft/publish). RBAC: <b>lessons.write</b> / <b>lessons.publish</b>.
          </div>
        </div>
      </div>
    </>
  );
}