// src/components/home/CourseGallery.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { http } from "../../api/http";
import { money } from "../../services/booking.utils";

type ApiTopicOption = { id: number; name: string };

type ApiCourseItem = {
  id?: number | string;
  slug?: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  price?: number | string;
  time?: number | string;
  hours?: number | string;
  ratingAvg?: number | string;
  rating?: number | string;
  enrollmentCount?: number | string;
  students?: number | string;
  published?: boolean;
  topicId?: number | string | null;
  courseTopic?: { id?: number | string; name?: string } | null;
  topic?: { id?: number | string; name?: string } | null;
};

type GalleryCourse = {
  id: string;
  slug: string;
  title: string;
  desc: string;
  topicName: string;
  imageUrl: string;
  price: number;
  hours: number;
  rating: number;
  students: number;
};

// CMS data only keeps text content (no style/layout config)
type CourseGalleryCMS = {
  heading?: string;
  subheading?: string;
  buttonText?: string;
  buttonIcon?: string;
};

type CourseGalleryProps = {
  onGetDeal?: () => void;
  cmsData?: CourseGalleryCMS;
};

const PAGE_SIZE = 8;
const LOAD_MORE_THRESHOLD_PX = 160;
const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1400&q=80";

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function mapCourse(item: ApiCourseItem, topicNameById: Map<number, string>): GalleryCourse | null {
  if (item?.id === undefined || item?.id === null) return null;

  const rawTopic = item.courseTopic || item.topic || null;
  const rawTopicId = rawTopic?.id ?? item.topicId ?? null;
  const topicId = rawTopicId == null ? null : Number(rawTopicId);

  return {
    id: String(item.id),
    slug: item.slug || String(item.id),
    title: item.title || "Khoa hoc",
    desc: item.shortDescription || item.description || "",
    topicName: rawTopic?.name || (topicId != null ? topicNameById.get(topicId) || "-" : "-"),
    imageUrl: item.thumbnail || FALLBACK_IMAGE,
    price: toNumber(item.price),
    hours: toNumber(item.time ?? item.hours),
    rating: toNumber(item.ratingAvg ?? item.rating),
    students: toNumber(item.enrollmentCount ?? item.students),
  };
}

export const CourseGallery: React.FC<CourseGalleryProps> = ({ onGetDeal, cmsData }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  const [courses, setCourses] = useState<GalleryCourse[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const requestIdRef = useRef(0);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });

  const {
    heading = "Khoa hoc noi bat",
    subheading = "Keo ngang de xem them khoa hoc va nap them du lieu tu API.",
    buttonText = "Nhan uu dai",
    buttonIcon = "fa-solid fa-ticket",
  } = cmsData ?? {};

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<{ language?: string }>) => {
      const nextLang = event.detail?.language;
      if (typeof nextLang === "string" && nextLang.trim()) {
        setCurrentLanguage(nextLang);
      }
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  const fetchCoursesPage = useCallback(
      async (pageToLoad: number, replace: boolean) => {
        if (loadingRef.current) return;
        if (!replace && !hasMoreRef.current) return;

        const requestId = requestIdRef.current;
        loadingRef.current = true;
        setIsLoading(true);
        setFetchError(null);

        try {
          const [coursesRes, topicsRes] = await Promise.all([
            http.get("/courses", {
              params: {
                lang: currentLanguage,
                page: pageToLoad,
                pageSize: PAGE_SIZE,
              },
            }),
            http.get("/courses/topics", {
              params: { lang: currentLanguage },
            }),
          ]);

          // Ignore stale response if language changed while request was running.
          if (requestId !== requestIdRef.current) return;

          const topicList: ApiTopicOption[] = Array.isArray(topicsRes.data) ? topicsRes.data : [];
          const topicNameById = new Map<number, string>(topicList.map((t) => [Number(t.id), t.name]));

          const rawItems: ApiCourseItem[] = Array.isArray(coursesRes.data?.items) ? coursesRes.data.items : [];
          const publishedItems = rawItems.filter((item) => item?.published !== false);
          const mapped = publishedItems
              .map((item) => mapCourse(item, topicNameById))
              .filter((item): item is GalleryCourse => Boolean(item));

          setCourses((prev) => {
            const base = replace ? [] : prev;
            const seen = new Set(base.map((item) => item.id));
            const next = [...base];

            for (const item of mapped) {
              if (seen.has(item.id)) continue;
              seen.add(item.id);
              next.push(item);
            }

            return next;
          });

          const apiTotal = Number(coursesRes.data?.total);
          const hasNext = Number.isFinite(apiTotal) && apiTotal > 0 ? pageToLoad * PAGE_SIZE < apiTotal : rawItems.length >= PAGE_SIZE;

          hasMoreRef.current = hasNext;
          setHasMore(hasNext);
          setNextPage(pageToLoad + 1);
        } catch (error) {
          if (requestId !== requestIdRef.current) return;
          console.error("Fetch gallery courses failed:", error);
          setFetchError("Khong the tai khoa hoc. Vui long thu lai.");
        } finally {
          if (requestId === requestIdRef.current) {
            setIsLoading(false);
            setIsInitLoading(false);
          }
          loadingRef.current = false;
        }
      },
      [currentLanguage],
  );

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return;
    void fetchCoursesPage(nextPage, false);
  }, [fetchCoursesPage, nextPage]);

  const maybeLoadMoreByPosition = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const remain = slider.scrollWidth - (slider.scrollLeft + slider.clientWidth);
    if (remain <= LOAD_MORE_THRESHOLD_PX) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    requestIdRef.current += 1;
    loadingRef.current = false;
    hasMoreRef.current = true;

    setCourses([]);
    setNextPage(1);
    setHasMore(true);
    setIsInitLoading(true);
    setFetchError(null);

    void fetchCoursesPage(1, true);
  }, [currentLanguage, fetchCoursesPage]);

  const stopDragging = useCallback(
      (event?: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current.active) return;

        const slider = sliderRef.current;
        if (slider && event) {
          try {
            slider.releasePointerCapture(event.pointerId);
          } catch {
            // No-op: pointer might have been released by browser.
          }
        }

        dragRef.current.active = false;
        setIsDragging(false);
        maybeLoadMoreByPosition();
      },
      [maybeLoadMoreByPosition],
  );

  const scrollTrack = useCallback(
      (direction: "prev" | "next") => {
        const slider = sliderRef.current;
        if (!slider) return;

        const amount = Math.max(280, Math.floor(slider.clientWidth * 0.85));
        slider.scrollBy({
          left: direction === "next" ? amount : -amount,
          behavior: "smooth",
        });

        if (direction === "next") {
          window.setTimeout(() => {
            maybeLoadMoreByPosition();
          }, 350);
        }
      },
      [maybeLoadMoreByPosition],
  );

  return (
      <section id="courseGallery" className="w-full py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
              <p className="mt-2 text-slate-600">{subheading}</p>
            </div>

            {/*<button*/}
            {/*    type="button"*/}
            {/*    onClick={onGetDeal}*/}
            {/*    className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:opacity-95 md:inline-flex"*/}
            {/*>*/}
            {/*  <i className={buttonIcon}></i> {buttonText}*/}
            {/*</button>*/}
          </div>

          <div className="relative mt-8">
            <button
                type="button"
                onClick={() => scrollTrack("prev")}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-700 ring-1 ring-slate-200 transition hover:bg-white md:flex"
                aria-label="Previous courses"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            <div
                ref={sliderRef}
                className={[
                  "flex gap-4 overflow-x-auto pb-3 pl-0 pr-0 snap-x snap-mandatory select-none touch-pan-y",
                  isDragging ? "cursor-grabbing" : "cursor-grab",
                  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                ].join(" ")}
                onScroll={maybeLoadMoreByPosition}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;

                  const target = event.target as HTMLElement;
                  if (target.closest("a, button, input, textarea, select, [role='button']")) {
                    return;
                  }

                  const slider = sliderRef.current;
                  if (!slider) return;

                  dragRef.current.active = true;
                  dragRef.current.startX = event.clientX;
                  dragRef.current.startScrollLeft = slider.scrollLeft;
                  dragRef.current.moved = false;
                  setIsDragging(true);
                  slider.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!dragRef.current.active) return;
                  const slider = sliderRef.current;
                  if (!slider) return;

                  const delta = event.clientX - dragRef.current.startX;
                  if (Math.abs(delta) > 10) dragRef.current.moved = true;
                  slider.scrollLeft = dragRef.current.startScrollLeft - delta;
                }}
                onPointerUp={(event) => stopDragging(event)}
                onPointerCancel={(event) => stopDragging(event)}
                onPointerLeave={(event) => stopDragging(event)}
                onClickCapture={(event) => {
                  if (!dragRef.current.moved) return;
                  event.preventDefault();
                  event.stopPropagation();
                  dragRef.current.moved = false;
                }}
            >
              {courses.map((c) => (
                  <Link
                      key={c.id}
                      to={`/courses/${encodeURIComponent(c.slug || c.id)}`}
                      className="group min-w-[280px] max-w-[280px] snap-start overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 transition hover:shadow"
                  >
                    <div className="relative">
                      <img className="h-44 w-full object-cover" src={c.imageUrl} alt={c.title} draggable={false} />
                      <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                        <i className="fa-solid fa-star text-[11px] text-amber-300" />
                        <span>{c.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {c.topicName || "-"}
                    </span>
                      </div>

                      <h3 className="mt-3 line-clamp-1 font-semibold text-slate-900 group-hover:underline">{c.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.desc || "Dang cap nhat mo ta khoa hoc."}</p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-slate-600">{`${c.hours || "-"} Hour - ${new Intl.NumberFormat("vi-VN").format(c.students)} HV`}</span>
                        <span className="font-semibold text-slate-900">{money(c.price)}</span>
                      </div>
                    </div>
                  </Link>
              ))}

              {isLoading ? (
                  <div className="min-w-[280px] max-w-[280px] snap-start rounded-3xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                    Dang tai them khoa hoc...
                  </div>
              ) : null}
            </div>

            <button
                type="button"
                onClick={() => scrollTrack("next")}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-700 ring-1 ring-slate-200 transition hover:bg-white md:flex"
                aria-label="Next courses"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          {isInitLoading && courses.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Dang tai khoa hoc...</p>
          ) : null}

          {!isInitLoading && !isLoading && courses.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Chua co khoa hoc de hien thi.</p>
          ) : null}

          {fetchError ? <p className="mt-4 text-sm text-rose-600">{fetchError}</p> : null}
        </div>
      </section>
  );
};
