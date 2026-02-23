import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Lang, LeadBookPayload, LeadTalkPayload } from "../app/types";
import { postLeadBook, postLeadTalk } from "../app/api";

type Props = {
  open: boolean;
  initialTab: "book" | "talk";
  onClose: () => void;
  lang: Lang;
  pageSlug?: string;
};

function todayMinDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function AyaModal({ open, initialTab, onClose, lang, pageSlug = "landing" }: Props) {
  const [tab, setTab] = useState<"book" | "talk">(initialTab);
  const [result, setResult] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      lastFocusRef.current = document.activeElement as any;
      setTab(initialTab);
      setResult(null);
      document.body.style.overflow = "hidden";
      return;
    }
    document.body.style.overflow = "";
  }, [open, initialTab]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      const el = lastFocusRef.current;
      if (el?.focus) el.focus();
    }
  }, [open]);

  const minDate = useMemo(() => todayMinDate(), []);

  async function handleBookSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setResult(null);

    const fd = new FormData(ev.currentTarget);
    const payload: LeadBookPayload = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      date: String(fd.get("date") || ""),
      time: fd.get("time") as any,
      note: String(fd.get("note") || ""),
      lang,
      pageSlug,
    };

    try {
      await postLeadBook(payload);
      setResult({ kind: "ok", text: "✅ Đã nhận yêu cầu đặt lịch. AYANAVITA sẽ liên hệ xác nhận." });
      ev.currentTarget.reset();
    } catch (e: any) {
      setResult({ kind: "err", text: `❌ Gửi thất bại: ${String(e?.message || e)}` });
    }
  }

  async function handleTalkSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setResult(null);

    const fd = new FormData(ev.currentTarget);
    const payload: LeadTalkPayload = {
      contact: String(fd.get("contact") || ""),
      topic: fd.get("topic") as any,
      message: String(fd.get("message") || ""),
      lang,
      pageSlug,
    };

    try {
      await postLeadTalk(payload);
      setResult({ kind: "ok", text: "✅ Đã gửi tin nhắn. AYANAVITA sẽ phản hồi sớm." });
      ev.currentTarget.reset();
    } catch (e: any) {
      setResult({ kind: "err", text: `❌ Gửi thất bại: ${String(e?.message || e)}` });
    }
  }

  if (!open) return null;

  return (
    <div className={`modal ${open ? "is-open" : ""}`} id="ayaModal" aria-hidden={!open}>
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div>
              <h3 className="modal-title" id="modalTitle">AYANAVITA</h3>
              <p className="modal-sub" id="modalSub">
                Choose “Book a Visit” để đặt lịch trải nghiệm hoặc “Talk to Us” để hỏi trước.
              </p>
            </div>
            <button className="icon-btn" type="button" aria-label="Close" onClick={onClose}>✕</button>
          </div>

          <div className="tabs" role="tablist" aria-label="AYANAVITA CTA Tabs">
            <button
              className={`tab-btn ${tab === "book" ? "is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={tab === "book"}
              onClick={() => setTab("book")}
            >
              Book a Visit • Đặt lịch
            </button>

            <button
              className={`tab-btn ${tab === "talk" ? "is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={tab === "talk"}
              onClick={() => setTab("talk")}
            >
              Talk to Us • Liên hệ
            </button>
          </div>

          <div className="modal-body">
            {tab === "book" ? (
              <section role="tabpanel">
                <form className="form-grid" onSubmit={handleBookSubmit}>
                  <div className="field half">
                    <label>Họ và tên</label>
                    <input name="name" required placeholder="Ví dụ: Nguyễn An" />
                  </div>
                  <div className="field half">
                    <label>Số điện thoại</label>
                    <input name="phone" required inputMode="tel" placeholder="Ví dụ: 09xx xxx xxx" />
                  </div>

                  <div className="field half">
                    <label>Ngày mong muốn</label>
                    <input name="date" type="date" required min={minDate} />
                  </div>
                  <div className="field half">
                    <label>Khung giờ</label>
                    <select name="time" required defaultValue="morning">
                      <option value="morning">Sáng (09:00 – 12:00)</option>
                      <option value="afternoon">Chiều (12:00 – 17:00)</option>
                      <option value="evening">Tối (17:00 – 20:30)</option>
                      <option value="any">Sớm nhất có thể</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Ghi chú (tuỳ chọn)</label>
                    <textarea name="note" placeholder="Bạn mong muốn trải nghiệm theo hướng nào? (tuỳ chọn)" />
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" type="submit">Confirm Booking</button>
                  </div>

                  {result && (
                    <div
                      className="result"
                      style={{
                        display: "block",
                        borderColor: result.kind === "ok" ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)",
                        background: result.kind === "ok" ? "rgba(34,197,94,.10)" : "rgba(239,68,68,.10)",
                      }}
                    >
                      {result.text}
                    </div>
                  )}

                  <div className="hint" style={{ marginTop: 10 }}>
                    Ghi chú: Trải nghiệm hướng thư giãn & đồng hành — hoàn toàn phi y tế.
                  </div>
                </form>
              </section>
            ) : (
              <section role="tabpanel">
                <form className="form-grid" onSubmit={handleTalkSubmit}>
                  <div className="field half">
                    <label>Email / SĐT</label>
                    <input name="contact" required placeholder="email@... hoặc 09xx..." />
                  </div>
                  <div className="field half">
                    <label>Chủ đề</label>
                    <select name="topic" required defaultValue="question">
                      <option value="question">Hỏi trước</option>
                      <option value="schedule">Tư vấn lịch</option>
                      <option value="experience">Tìm hiểu trải nghiệm</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Nội dung</label>
                    <textarea name="message" required placeholder="Bạn muốn chia sẻ / hỏi điều gì?" />
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" type="submit">Send message</button>
                  </div>

                  {result && (
                    <div
                      className="result"
                      style={{
                        display: "block",
                        borderColor: result.kind === "ok" ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)",
                        background: result.kind === "ok" ? "rgba(34,197,94,.10)" : "rgba(239,68,68,.10)",
                      }}
                    >
                      {result.text}
                    </div>
                  )}
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
