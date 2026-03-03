// src/pages/CoursePlayerPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DEMO_COURSE, flattenLessons } from "../data/coursePlayer.demo";
import type { CourseLesson } from "../data/coursePlayer.demo";
import { getProgress, isDone, markDone } from "../services/coursePlayer.storage";
import { useEscapeKey, useHotkey } from "../hooks/useUiGuards";

import { CurriculumPanel } from "../components/course-player/CurriculumPanel";
import { PlayerArea } from "../components/course-player/PlayerArea";
import { TabsPanel } from "../components/course-player/TabsPanel";
import { MobileCurriculumDrawer } from "../components/course-player/MobileCurriculumDrawer";
import { QuizBuilderModal } from "../components/course-player/modals/QuizBuilderModal";
import { AssignmentModal } from "../components/course-player/modals/AssignmentModal";
import { OrderCard } from "../components/course-player/OrderCard";

export default function CoursePlayerPage() {
  const course = DEMO_COURSE;

  const flat = useMemo(() => flattenLessons(course), [course]);
  const totalMins = useMemo(() => flat.reduce((s, x) => s + Number(x.lesson.duration || 0), 0), [flat]);

  const [lessonId, setLessonId] = useState(flat[0]?.lesson.id || "");
  const active = useMemo<CourseLesson>(() => {
    return flat.find((x) => x.lesson.id === lessonId)?.lesson || flat[0].lesson;
  }, [flat, lessonId]);

  const [theater, setTheater] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  const [quizOpen, setQuizOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  // Hotkey "/" focus search
  useHotkey(
    "/",
    () => {
      const el = searchRef.current;
      if (!el) return;
      if (document.activeElement === el) return;
      // prevent input in other fields? (basic)
      el.focus();
    },
    true
  );

  // Escape closes modals + drawer + stop theater? (ở đây chỉ close overlay)
  useEscapeKey(() => {
    setQuizOpen(false);
    setAssignOpen(false);
    setDrawerOpen(false);
  }, true);

  // Theater mode: toggle body class for CSS rules
  useEffect(() => {
    document.body.classList.toggle("theater", theater);
    return () => document.body.classList.remove("theater");
  }, [theater]);

  // Progress derived
  const progress = useMemo(() => {
    const p = getProgress(course.id);
    const doneCount = flat.filter((x) => p.done.includes(x.lesson.id)).length;
    const total = flat.length;
    const pct = total ? Math.round((doneCount / total) * 100) : 0;
    return { doneCount, total, pct };
  }, [course.id, flat, lessonId]); // re-render on lesson changes

  const onSelectLesson = (id: string) => {
    setLessonId(id);
  };

  return (
    <div className="min-h-screen text-slate-900">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl gradient-primary flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-500/25">
                A
              </div>
              <div className="hidden sm:block">
                <div className="font-extrabold">AYANAVITA LMS</div>
                <div className="text-xs font-extrabold text-slate-500">Course Detail + Player</div>
              </div>
            </a>
            <span className="hidden lg:inline-flex chip">
              <i className="fa-solid fa-shield-halved text-amber-500" /> Prototype
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn lg:hidden" onClick={() => setDrawerOpen(true)} type="button">
              <i className="fa-solid fa-list mr-2" />
              Curriculum
            </button>

            <button className="btn" onClick={() => setTheater((v) => !v)} type="button">
              {theater ? (
                <>
                  <i className="fa-solid fa-compress mr-2" />
                  Exit
                </>
              ) : (
                <>
                  <i className="fa-solid fa-expand mr-2" />
                  Theater
                </>
              )}
            </button>

            <button
              className="btn btn-accent"
              onClick={() => {
                // Enroll = create order in OrderCard (tách rồi); ở đây chỉ scroll
                const el = document.getElementById("rightPane");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              type="button"
            >
              <i className="fa-solid fa-cart-shopping mr-2" />
              Enroll
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="relative h-[220px] sm:h-[280px] lg:h-full">
                <img className="absolute inset-0 h-full w-full object-cover" src={course.cover} alt="Course cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/20 to-transparent" />

                <div className="absolute left-4 bottom-4 right-4 flex flex-wrap gap-2">
                  <span className="chip">
                    <i className="fa-solid fa-star text-amber-500" />
                    {course.rating}
                  </span>
                  <span className="chip">
                    <i className="fa-solid fa-users text-indigo-600" />
                    {new Intl.NumberFormat("vi-VN").format(course.students)}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">COURSE DETAIL</div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">{course.title}</h1>
                  <p className="mt-2 text-sm text-slate-600">{course.subtitle}</p>
                </div>

                <div className="flex gap-2">
                  <span className="chip">
                    <i className="fa-solid fa-tag text-emerald-600" />
                    ₫ {new Intl.NumberFormat("vi-VN").format(course.price)}
                  </span>
                  <span className="chip">
                    <i className="fa-solid fa-signal text-indigo-600" />
                    {course.level}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  Tip: nhấn <b>/</b> để focus search lesson • <b>Esc</b> để đóng modal/drawer.
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  <span className="text-slate-900">Order:</span> Chưa có đơn hàng
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div id="mainGrid" className="grid lg:grid-cols-[1fr_420px] gap-4">
          {/* LEFT */}
          <main className="grid gap-4">
            {/* Player header search + progress chips */}
            <div className="card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <span className="chip">
                    <i className="fa-solid fa-list-check text-emerald-600" />
                    {progress.pct}%
                  </span>
                  <span className="chip">
                    <i className="fa-solid fa-circle-check text-emerald-600" />
                    {progress.doneCount}/{progress.total}
                  </span>
                </div>

                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    className="field pl-11 w-full md:w-[320px]"
                    placeholder="Tìm lesson... (nhấn /)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Drip lock: lesson tiếp theo khóa nếu chưa hoàn thành lesson trước.
              </div>
            </div>

            <PlayerArea
              course={course}
              activeLesson={active}
              onSelectLesson={onSelectLesson}
              onOpenQuiz={() => setQuizOpen(true)}
              onOpenAssignment={() => setAssignOpen(true)}
              autoplayEnabled={autoplayEnabled}
              onToggleAutoplay={setAutoplayEnabled}
            />

            <TabsPanel course={course} lessonId={lessonId} />
          </main>

          {/* RIGHT */}
          <aside id="rightPane" className="grid gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">CURRICULUM</div>
                  <div className="text-lg font-extrabold">Nội dung khóa học</div>
                </div>
                <span className="chip">
                  <i className="fa-solid fa-layer-group text-indigo-600" />
                  {course.modules.length} modules
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between text-sm text-slate-700 font-extrabold">
                  <span>Progress</span>
                  <span>{progress.doneCount}/{progress.total}</span>
                </div>
                <div className="mt-3 h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full gradient-primary" style={{ width: `${progress.pct}%` }} />
                </div>
              </div>

              <div className="mt-4">
                <CurriculumPanel
                  course={course}
                  activeLessonId={lessonId}
                  search={search}
                  onSelectLesson={onSelectLesson}
                />
              </div>
            </div>

            <OrderCard course={course} />
          </aside>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          © 2025 AYANAVITA • React Prototype (Udemy-like Player + Course Detail)
        </div>
      </section>

      {/* DRAWER (mobile curriculum) */}
      <MobileCurriculumDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        course={course}
        activeLessonId={lessonId}
        search={search}
        onSelectLesson={onSelectLesson}
      />

      {/* MODALS */}
      <QuizBuilderModal
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        courseId={course.id}
        lessonId={lessonId}
      />

      <AssignmentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        courseId={course.id}
        lessonId={lessonId}
      />
    </div>
  );
}
