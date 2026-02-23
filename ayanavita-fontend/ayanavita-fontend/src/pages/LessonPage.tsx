import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { progressApi } from "../api/progress.api";
import { http } from "../api/http";

type LessonDetail = {
  id: number;
  courseId?: number;
  title: string;
  content?: string;
  videoUrl?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function LessonPage() {
  const { id } = useParams();
  const lessonId = Number(id);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // video tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const durationRef = useRef<number>(0);

  const [seconds, setSeconds] = useState<number>(0);
  const [percent, setPercent] = useState<number>(0);

  // autosave + anti-spam
  const autosaveTimerRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ s: number; p: number } | null>(null);
  const savingRef = useRef(false);

  const canUse = useMemo(
    () => Number.isFinite(lessonId) && lessonId > 0,
    [lessonId]
  );

  async function load() {
    setLoading(true);
    setErr(null);
    setInfo(null);

    try {
      const data = await http<LessonDetail>(`/lessons/${lessonId}`);
      setLesson(data);
    } catch (e: any) {
      setLesson(null);
      setErr(
        e?.message ||
          "Không tải được lesson (có thể bị khóa sequential hoặc chưa ACTIVE)."
      );
    } finally {
      setLoading(false);
    }
  }

  // Resume từ /me/progress (best-effort)
  async function tryResume() {
    try {
      const list = await progressApi.myProgress();
      const row = Array.isArray(list)
        ? list.find((x: any) => x.lessonId === lessonId)
        : null;

      // backend bạn đang trả lastPositionSec; FE type có thể gọi seconds
      const s = safeNum(row?.lastPositionSec ?? row?.seconds ?? 0, 0);
      if (s > 0) {
        setSeconds(s);
        const v = videoRef.current;
        if (v) v.currentTime = s;
      }

      // nếu backend trả percent luôn thì set luôn (không bắt buộc)
      const p = safeNum(row?.percent ?? 0, 0);
      if (p > 0) setPercent(clamp(p, 0, 100));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!canUse) return;
    load().then(() => {
      void tryResume();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  function computePercent(sec: number) {
    const d = durationRef.current;
    if (!d || d <= 0) return 0;
    return clamp((sec / d) * 100, 0, 100);
  }

  function onLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    durationRef.current = safeNum(v.duration, 0);

    // nếu đã resume seconds trước đó thì seek lại
    if (seconds > 0) {
      try {
        v.currentTime = seconds;
      } catch {
        // ignore
      }
    }
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;

    const sec = safeNum(v.currentTime, 0);
    const p = computePercent(sec);

    setSeconds(sec);
    setPercent(p);
  }

  async function sendProgress(
    s: number,
    p: number,
    reason: string,
    showInfo: boolean
  ) {
    if (!canUse) return;
    if (savingRef.current) return;

    const ss = clamp(Math.floor(s), 0, 999999);
    const pp = clamp(Math.floor(p), 0, 100);

    const last = lastSentRef.current;
    // chống spam: nếu đổi rất nhỏ thì skip
    if (last && Math.abs(last.s - ss) < 3 && Math.abs(last.p - pp) < 1) return;

    savingRef.current = true;
    try {
      // chuẩn backend DTO: { lastPositionSec, percent }
      await progressApi.upsert(lessonId, { lastPositionSec: ss, percent: pp });
      lastSentRef.current = { s: ss, p: pp };
      if (showInfo) setInfo(`Saved (${reason}) — ${ss}s — ${pp}%`);
    } catch (e: any) {
      if (showInfo) setErr(e?.message || "Save progress failed");
    } finally {
      savingRef.current = false;
    }
  }

  async function onManualSave() {
    setErr(null);
    setInfo(null);
    await sendProgress(seconds, percent, "manual", true);
  }

  async function onComplete() {
    setErr(null);
    setInfo(null);
    try {
      await progressApi.complete(lessonId);
      setInfo("Đã hoàn thành bài học.");
      // cũng update local percent cho UI
      setPercent(100);
    } catch (e: any) {
      setErr(e?.message || "Complete failed");
    }
  }

  // Autosave mỗi 15s (best-effort, không spam info)
  useEffect(() => {
    if (!canUse) return;

    if (autosaveTimerRef.current)
      window.clearInterval(autosaveTimerRef.current);

    autosaveTimerRef.current = window.setInterval(() => {
      void sendProgress(seconds, percent, "auto", false);
    }, 15000);

    return () => {
      if (autosaveTimerRef.current)
        window.clearInterval(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse, lessonId, seconds, percent]);

  // Save before unload (best-effort)
  useEffect(() => {
    if (!canUse) return;

    const handler = () => {
      void sendProgress(seconds, percent, "unload", false);
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse, seconds, percent]);

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/me/courses">← My Courses</Link>
          <Link to="/courses">Courses</Link>
          {lesson?.courseId ? (
            <Link to={`/courses/${lesson.courseId}`}>Back to Course</Link>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onManualSave} disabled={!canUse}>
            Save
          </button>
          <button onClick={onComplete} disabled={!canUse}>
            Complete
          </button>
        </div>
      </div>

      <h2 style={{ marginTop: 10 }}>Lesson #{lessonId}</h2>

      {loading && <div style={{ padding: 12 }}>Loading...</div>}
      {err && <div style={{ marginTop: 10, color: "crimson" }}>{err}</div>}
      {info && <div style={{ marginTop: 10 }}>{info}</div>}

      {!loading && lesson && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{lesson.title}</div>

          {lesson.videoUrl ? (
            <div
              style={{
                marginTop: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                background: "#fff",
                padding: 12,
              }}
            >
              <video
                ref={videoRef}
                controls
                style={{ width: "100%", borderRadius: 12 }}
                src={lesson.videoUrl}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onPause={() => void sendProgress(seconds, percent, "pause", false)}
                onEnded={() => void sendProgress(seconds, 100, "ended", false)}
              />

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                  fontSize: 13,
                  opacity: 0.85,
                }}
              >
                <div>
                  Time: <b>{Math.floor(seconds)}s</b>
                </div>
                <div>
                  Percent: <b>{Math.floor(percent)}%</b>
                </div>
              </div>

              <div
                style={{
                  marginTop: 8,
                  height: 10,
                  borderRadius: 999,
                  background: "#eee",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${clamp(percent, 0, 100)}%`,
                    height: "100%",
                    background: "#111",
                  }}
                />
              </div>

              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                Auto-save mỗi 15 giây + khi Pause/Ended. Payload:{" "}
                <code>{`{ lastPositionSec: ${Math.floor(
                  seconds
                )}, percent: ${Math.floor(percent)} }`}</code>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12, opacity: 0.8 }}>
              Lesson không có videoUrl. Bạn vẫn dùng Complete/Save được.
            </div>
          )}

          {lesson.content && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                background: "#fff",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {lesson.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
