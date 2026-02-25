import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ParticlesBackground } from "../components/layout/ParticlesBackground";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

import { AuthModal } from "../components/home/AuthModal";
import { SuccessModal } from "../components/home/SuccessModal";

import { money } from "../services/booking.utils";
import { http } from "../api/http";
import {
  SERVICES,
  type Service,
  type ServiceCat,
  type ServiceGoal,
} from "../data/services.data";

type AuthTab = "login" | "register";

type DurRule = "all" | "lt60" | "60-90" | "gt90";
type GoalRule = "all" | ServiceGoal;
type CatRule = "all" | ServiceCat;
type SortRule = "popular" | "priceAsc" | "priceDesc" | "rating";

// CMS types
interface CmsData {
  hero: {
    preTitle: string;
    title: string;
    chips: { text: string; icon: string }[];
  };
  filters: {
    title: string;
    search: { label: string; placeholder: string };
    category: { label: string; options: { value: string; label: string }[] };
    goal: { label: string; options: { value: string; label: string }[] };
    duration: { label: string; options: { value: string; label: string }[] };
    sort: { label: string; options: { value: string; label: string }[] };
  };
  listSection: {
    preTitle: string;
    title: string;
    showingText: string;
    servicesText: string;
    bookButton: string;
  };
  card: {
    detailsButton: string;
    bookButton: string;
    minutes: string;
  };
  pagination: {
    prev: string;
    next: string;
    page: string;
  };
}

// Nội dung mặc định cho CMS (fallback)
const defaultCmsData: CmsData = {
  hero: {
    preTitle: "Dịch vụ AYANAVITA",
    title: "Trải nghiệm Spa chuyên sâu, chuẩn hoá theo hệ thống",
    chips: [
      { text: "Quy trình chuẩn", icon: "fa-solid fa-shield-halved" },
      { text: "Chuyên viên", icon: "fa-solid fa-user-doctor" },
      { text: "Đánh giá cao", icon: "fa-solid fa-star" }
    ]
  },
  filters: {
    title: "Bộ lọc dịch vụ",
    search: {
      label: "Tìm theo tên",
      placeholder: "VD: chăm sóc da, trị liệu..."
    },
    category: {
      label: "Danh mục",
      options: [
        { value: "all", label: "Tất cả" },
        { value: "skin", label: "Chăm sóc da" },
        { value: "body", label: "Body / Thư giãn" },
        { value: "health", label: "Sức khoẻ trị liệu" },
        { value: "package", label: "Gói liệu trình" }
      ]
    },
    goal: {
      label: "Mục tiêu",
      options: [
        { value: "all", label: "Tất cả" },
        { value: "relax", label: "Thư giãn" },
        { value: "acne", label: "Giảm mụn" },
        { value: "bright", label: "Sáng da" },
        { value: "restore", label: "Phục hồi" },
        { value: "pain", label: "Giảm đau nhức" }
      ]
    },
    duration: {
      label: "Thời lượng",
      options: [
        { value: "all", label: "Tất cả" },
        { value: "lt60", label: "< 60 phút" },
        { value: "60-90", label: "60–90 phút" },
        { value: "gt90", label: "> 90 phút" }
      ]
    },
    sort: {
      label: "Sắp xếp",
      options: [
        { value: "popular", label: "Phổ biến" },
        { value: "priceAsc", label: "Giá tăng" },
        { value: "priceDesc", label: "Giá giảm" },
        { value: "rating", label: "Đánh giá" }
      ]
    }
  },
  listSection: {
    preTitle: "Danh sách",
    title: "Dịch vụ nổi bật",
    showingText: "Hiển thị",
    servicesText: "dịch vụ",
    bookButton: "Đặt lịch"
  },
  card: {
    detailsButton: "Chi tiết",
    bookButton: "Đặt",
    minutes: "phút"
  },
  pagination: {
    prev: "Trước",
    next: "Sau",
    page: "Trang"
  }
};

function matchDur(dur: number, rule: DurRule) {
  if (rule === "all") return true;
  if (rule === "lt60") return dur < 60;
  if (rule === "60-90") return dur >= 60 && dur <= 90;
  if (rule === "gt90") return dur > 90;
  return true;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const icons = Array.from({ length: full }, (_, i) => (
      <i key={i} className="fa-solid fa-star star" />
  ));
  return <span className="flex items-center gap-1">{icons}</span>;
}

function ServiceCard({ s, cms }: { s: Service; cms: CmsData }) {
  return (
      <article className="card p-4 flex flex-col gap-0">
        <img
            className="h-36 w-full rounded-2xl object-cover ring-1 ring-slate-200"
            src={s.img}
            alt={s.name}
        />

        <div className="mt-3 flex items-start justify-between gap-2">
          <div>
            <div className="font-extrabold">{s.name}</div>
            <div className="text-xs text-slate-500">
              {s.id} • {s.duration} {cms.card.minutes}
            </div>
          </div>

          <span className="chip">
          <i className="fa-solid fa-tag text-emerald-600" />
            {money(s.price)}
        </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Stars rating={s.rating} /> <b>{s.rating.toFixed(1)}</b>
          </div>
          <span className="chip">
          <i className="fa-solid fa-fire text-rose-600" />
            {s.tag}
        </span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link className="btn" to={`/services/${s.id}`}>
            <i className="fa-solid fa-circle-info" />
            {cms.card.detailsButton}
          </Link>

          <Link className="btn btn-primary hover:text-purple-800" to="/booking">
            <i className="fa-solid fa-calendar-check" />
            {cms.card.bookButton}
          </Link>
        </div>
      </article>
  );
}

export default function ServicesPage() {
  // State cho ngôn ngữ và dữ liệu CMS từ API (giống CartPage)
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });
  const [cmsDataFromAPI, setCmsDataFromAPI] = useState<Partial<CmsData> | null>(null);

  // Lắng nghe sự kiện thay đổi ngôn ngữ từ Header
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };
    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () =>
        window.removeEventListener(
            "languageChange",
            handleLanguageChange as EventListener
        );
  }, []);

  // Gọi API lấy nội dung CMS cho trang services
  useEffect(() => {
    const fetchCms = async () => {
      try {
        // NOTE: endpoint theo pattern của CartPage. Nếu BE dùng slug khác, đổi "services" tại đây.
        const res = await http.get(`/public/pages/services?lang=${currentLanguage}`);
        setCmsDataFromAPI(res.data.sections?.[0]?.data ?? null);
        console.log("dữ liệu services", res.data.sections?.[0]?.data);
      } catch (error) {
        console.error("Lỗi gọi API services:", error);
        // Nếu lỗi, vẫn giữ cmsDataFromAPI = null, sẽ dùng default
        setCmsDataFromAPI(null);
      }
    };
    fetchCms();
  }, [currentLanguage]);

  // Merge dữ liệu từ API với default (API ghi đè lên default)
  const cms = useMemo(() => {
    return { ...defaultCmsData, ...(cmsDataFromAPI || {}) } as CmsData;
  }, [cmsDataFromAPI]);

  // shared auth/success (đồng bộ Home)
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [success, setSuccess] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const openAuth = useCallback((tab: AuthTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const openSuccess = useCallback((message: string) => {
    setSuccess({ open: true, message });
  }, []);

  // filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatRule>("all");
  const [goal, setGoal] = useState<GoalRule>("all");
  const [dur, setDur] = useState<DurRule>("all");
  const [sort, setSort] = useState<SortRule>("popular");

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    let list = SERVICES.filter((s) => {
      const okQ =
          !qq ||
          s.name.toLowerCase().includes(qq) ||
          s.id.toLowerCase().includes(qq);

      const okC = cat === "all" ? true : s.cat === cat;
      const okG = goal === "all" ? true : (s.goal || []).includes(goal);
      const okD = matchDur(s.duration, dur);
      return okQ && okC && okG && okD;
    });

    if (sort === "popular") list = [...list].sort((a, b) => b.booked - a.booked);
    if (sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);

    return list;
  }, [q, cat, goal, dur, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  function reset() {
    setQ("");
    setCat("all");
    setGoal("all");
    setDur("all");
    setSort("popular");
    setPage(1);
  }

  function bumpToFirstPage() {
    setPage(1);
  }

  return (
      <div className="bg-slate-50 text-slate-900">
        <div className="page-content">
          <main className="px-4 pb-10">
            <div className="max-w-6xl mx-auto overflow-hidden">
              {/* Hero */}
              <div className="relative">
                <img
                    className="h-52 w-full object-cover"
                    alt="services"
                    src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=70"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 to-indigo-700/20" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="text-xs font-extrabold text-white/80">{cms.hero.preTitle}</div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                    {cms.hero.title}
                  </h1>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {cms.hero.chips.map((chip, idx) => (
                        <span key={idx} className="chip">
                      <i className={chip.icon} />
                          {chip.text}
                    </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 grid gap-4 lg:grid-cols-4">
                {/* Filters */}
                <aside className="lg:col-span-1">
                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold">{cms.filters.title}</div>
                      <button
                          onClick={reset}
                          className="btn px-3 py-2"
                          type="button"
                          aria-label="reset"
                      >
                        <i className="fa-solid fa-rotate-left" />
                      </button>
                    </div>

                    <div className="mt-3">
                      <label className="text-sm font-extrabold text-slate-700">{cms.filters.search.label}</label>
                      <input
                          className="field mt-2"
                          placeholder={cms.filters.search.placeholder}
                          value={q}
                          onChange={(e) => {
                            setQ(e.target.value);
                            bumpToFirstPage();
                          }}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-extrabold text-slate-700">{cms.filters.category.label}</label>
                      <select
                          className="field mt-2"
                          value={cat}
                          onChange={(e) => {
                            setCat(e.target.value as CatRule);
                            bumpToFirstPage();
                          }}
                      >
                        {cms.filters.category.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-extrabold text-slate-700">{cms.filters.goal.label}</label>
                      <select
                          className="field mt-2"
                          value={goal}
                          onChange={(e) => {
                            setGoal(e.target.value as GoalRule);
                            bumpToFirstPage();
                          }}
                      >
                        {cms.filters.goal.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-extrabold text-slate-700">{cms.filters.duration.label}</label>
                      <select
                          className="field mt-2"
                          value={dur}
                          onChange={(e) => {
                            setDur(e.target.value as DurRule);
                            bumpToFirstPage();
                          }}
                      >
                        {cms.filters.duration.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-extrabold text-slate-700">{cms.filters.sort.label}</label>
                      <select
                          className="field mt-2"
                          value={sort}
                          onChange={(e) => {
                            setSort(e.target.value as SortRule);
                            bumpToFirstPage();
                          }}
                      >
                        {cms.filters.sort.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </aside>

                {/* List */}
                <section className="lg:col-span-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs font-extrabold text-slate-500">{cms.listSection.preTitle}</div>
                      <h2 className="text-xl font-extrabold">{cms.listSection.title}</h2>
                      <div className="text-sm text-slate-600">
                        {cms.listSection.showingText} <b>{filtered.length}</b> {cms.listSection.servicesText}
                      </div>
                    </div>

                    <Link to="/booking" className="btn btn-primary hover:text-purple-800">
                      <i className="fa-solid fa-calendar-check" />
                      {cms.listSection.bookButton}
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pageItems.length ? (
                        pageItems.map((s) => <ServiceCard key={s.id} s={s} cms={cms} />)
                    ) : (
                        <div className="text-slate-600 p-6">Không có dịch vụ phù hợp bộ lọc.</div>
                    )}
                  </div>

                  {/* Pagination */}
                  <div className="mt-5 flex items-center justify-between">
                    <button
                        className={`btn ${safePage <= 1 ? "opacity-50" : ""}`}
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        type="button"
                    >
                      {cms.pagination.prev}
                    </button>

                    <div className="chip">
                      {cms.pagination.page} <span className="mx-1 font-extrabold">{safePage}</span>/
                      <span className="ml-1 font-extrabold">{totalPages}</span>
                    </div>

                    <button
                        className={`btn ${safePage >= totalPages ? "opacity-50" : ""}`}
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        type="button"
                    >
                      {cms.pagination.next}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
  );
}