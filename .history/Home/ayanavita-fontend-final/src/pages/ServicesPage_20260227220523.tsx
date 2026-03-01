import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ParticlesBackground } from "../components/layout/ParticlesBackground";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

import { AuthModal } from "../components/home/AuthModal";
import { SuccessModal } from "../components/home/SuccessModal";

import { money } from "../services/booking.utils";
import { http } from "../api/http";

type AuthTab = "login" | "register";
type DurRule = "all" | "lt60" | "60-90" | "gt90";
type SortRule = "popular" | "priceAsc" | "priceDesc" | "rating";

type ApiService = {
  id: string;
  dbId: number;
  name: string;
  cat: string;
  goal: string[];
  duration: number;
  price: number;
  rating: number;
  booked: number;
  img?: string | null;
  tag: string;
};

type PreferredLanguage = "vi" | "en" | "ja";

function getPreferredLanguage(): PreferredLanguage {
  if (typeof window === "undefined") return "vi";

  const raw = window.localStorage.getItem("preferred-language")?.trim().toLowerCase();
  if (raw === "en") return "en";
  if (raw === "ja") return "ja";
  return "vi";
}


function usePreferredLanguage() {
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(() => getPreferredLanguage());

  useEffect(() => {
    const syncPreferredLanguage = () => setPreferredLanguage(getPreferredLanguage());

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== "preferred-language") return;
      syncPreferredLanguage();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("preferred-language-changed", syncPreferredLanguage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("preferred-language-changed", syncPreferredLanguage);
    };
  }, []);

  return preferredLanguage;
}

const GOAL_LABELS: Record<string, string> = {
  relax: "Thư giãn",
  acne: "Giảm mụn",
  bright: "Sáng da",
  restore: "Phục hồi",
  pain: "Giảm đau nhức",
};

function matchDur(dur: number, rule: DurRule) {
  if (rule === "all") return true;
  if (rule === "lt60") return dur < 60;
  if (rule === "60-90") return dur >= 60 && dur <= 90;
  if (rule === "gt90") return dur > 90;
  return true;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.max(1, Math.floor(rating));
  const icons = Array.from({ length: full }, (_, i) => (
    <i key={i} className="fa-solid fa-star star" />
  ));
  return <span className="flex items-center gap-1">{icons}</span>;
}

function ServiceCard({ s }: { s: ApiService }) {
  return (
    <article className="card p-4">
      <img
        className="h-36 w-full rounded-2xl object-cover ring-1 ring-slate-200"
        src={s.img || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=70"}
        alt={s.name}
      />

      <div className="mt-3">
        <div
          className="font-extrabold min-h-[3rem] leading-6"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {s.name}
        </div>

        <div className="mt-2">
          <span className="chip">
            <i className="fa-solid fa-tag text-emerald-600" />
            {money(s.price)}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          {s.id} • {s.duration} phút
        </div>
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

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link className="btn" to={`/services/${s.id}`}>
          <i className="fa-solid fa-circle-info" />
          Chi tiết
        </Link>

        <Link className="btn btn-primary" to={`/booking?serviceId=${s.dbId}`}>
          <i className="fa-solid fa-calendar-check" />
          Đặt
        </Link>
      </div>
    </article>
  );
}

export default function ServicesPage() {
  const preferredLanguage = usePreferredLanguage();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [success, setSuccess] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ApiService[]>([]);

  const openAuth = useCallback((tab: AuthTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const openSuccess = useCallback((message: string) => {
    setSuccess({ open: true, message });
  }, []);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [goal, setGoal] = useState("all");
  const [dur, setDur] = useState<DurRule>("all");
  const [sort, setSort] = useState<SortRule>("popular");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await http.get("/booking/services-page", {
          params: { lang: preferredLanguage },
        });
        if (!mounted) return;
        setServices(Array.isArray(data) ? data : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [preferredLanguage]);

  const availableCats = useMemo(
    () => Array.from(new Set(services.map((s) => s.cat).filter(Boolean))),
    [services]
  );

  const availableGoals = useMemo(
    () => Array.from(new Set(services.flatMap((s) => s.goal || []).filter(Boolean))),
    [services]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    let list = services.filter((s) => {
      const okQ = !qq || s.name.toLowerCase().includes(qq) || s.id.toLowerCase().includes(qq);
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
  }, [services, q, cat, goal, dur, sort]);

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

  return (
    <div className="bg-slate-50 text-slate-900">
      <div className="page-content">

        <main className="px-4 pb-10">
          <div className="max-w-6xl mx-auto card overflow-hidden">
            <div className="relative">
              <img
                className="h-52 w-full object-cover"
                alt="services"
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 to-indigo-700/20" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="text-xs font-extrabold text-white/80">Dịch vụ AYANAVITA</div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                  Trải nghiệm Spa chuyên sâu, chuẩn hoá theo hệ thống
                </h1>
              </div>
            </div>

            <div className="p-6 grid gap-4 lg:grid-cols-4">
              <aside className="lg:col-span-1">
                <div className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold">Bộ lọc dịch vụ</div>
                    <button onClick={reset} className="btn px-3 py-2" type="button" aria-label="reset">
                      <i className="fa-solid fa-rotate-left" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="text-sm font-extrabold text-slate-700">Tìm theo tên</label>
                    <input className="field mt-2" placeholder="VD: chăm sóc da, trị liệu..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-extrabold text-slate-700">Danh mục</label>
                    <select className="field mt-2" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }}>
                      <option value="all">Tất cả</option>
                      {availableCats.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-extrabold text-slate-700">Mục tiêu</label>
                    <select className="field mt-2" value={goal} onChange={(e) => { setGoal(e.target.value); setPage(1); }}>
                      <option value="all">Tất cả</option>
                      {availableGoals.map((g) => <option key={g} value={g}>{GOAL_LABELS[g] || g}</option>)}
                    </select>
                  </div>
                </div>
              </aside>

              <section className="lg:col-span-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-xs font-extrabold text-slate-500">Danh sách</div>
                    <h2 className="text-xl font-extrabold">Dịch vụ nổi bật</h2>
                    <div className="text-sm text-slate-600">Hiển thị <b>{filtered.length}</b> dịch vụ</div>
                  </div>
                  <Link to="/booking" className="btn btn-primary"><i className="fa-solid fa-calendar-check" />Đặt lịch</Link>
                </div>

                {loading ? <div className="mt-4 text-sm text-slate-500">Đang tải dữ liệu dịch vụ từ API...</div> : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pageItems.length ? pageItems.map((s) => <ServiceCard key={s.id} s={s} />) : <div className="text-slate-600 p-6">Không có dịch vụ phù hợp bộ lọc.</div>}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button className={`btn ${safePage <= 1 ? "opacity-50" : ""}`} disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">Trước</button>
                  <div className="chip">Trang <span className="mx-1 font-extrabold">{safePage}</span>/<span className="ml-1 font-extrabold">{totalPages}</span></div>
                  <button className={`btn ${safePage >= totalPages ? "opacity-50" : ""}`} disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} type="button">Sau</button>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <SuccessModal open={success.open} message={success.message} onClose={() => setSuccess({ open: false, message: "" })} />
      <AuthModal
        open={authOpen}
        tab={authTab}
        onClose={() => setAuthOpen(false)}
        onSwitchTab={setAuthTab}
        onLoginSuccess={() => { setAuthOpen(false); openSuccess("Đăng nhập thành công."); }}
        onRegisterSuccess={() => { setAuthOpen(false); openSuccess("Đăng ký thành công."); }}
      />
    </div>
  );
}
