import React, { useEffect, useMemo, useState } from "react";
import { AppShell, Badge, Button, Card, Container, Hr, Muted, SubTitle, Title } from "../ui/ui";

import type { Review, ReviewsState, ReviewCategory } from "../features/reviews/reviews.types";
import { ensureSeed } from "../features/reviews/reviews.seed";
import {
  clearAllDemo,
  loadReviews,
  loadSavedIds,
  loadVoteMap,
  saveReviews,
  saveSavedIds,
  saveVoteMap,
} from "../features/reviews/reviews.storage";
import { calcStats, matches, sortReviews, starIconsCount } from "../features/reviews/reviews.utils";
import { StarPicker, StarsRow } from "../features/components/Stars";
import {http} from "../api/http";

const LUX_BG =
    "relative overflow-hidden bg-slate-950 text-white " +
    "before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(11,18,32,.92),rgba(17,24,39,.84),rgba(11,18,32,.65))] before:content-['']";

/**
 * cmsData chỉ chứa NỘI DUNG có thể chỉnh từ CMS (text/label/placeholder/FAQ...),
 * KHÔNG chứa màu sắc/kích thước/layout và KHÔNG chứa các phần liên quan DB.
 * Ưu tiên thuộc tính đơn & mảng, hạn chế object lồng sâu.
 */
const cmsDataDefault = {
  brandName: "AYANAVITA",

  hero: {
    chips: ["Verified Reviews", "CSKH hỗ trợ", "Ưu đãi theo hạng"],
    titleParts: ["Khách hàng nói gì về ", "AYANAVITA"],
    descriptionParts: [
      "Xem đánh giá thực tế về ",
      "dịch vụ",
      ", ",
      "sản phẩm",
      " và trải nghiệm tại cơ sở. Bạn cũng có thể viết đánh giá để nhận voucher (demo).",
    ],
    actions: ["Xem danh sách", "Viết đánh giá ngay"],
  },

  statsCards: [
    { label: "Điểm TB", suffix: "/ 5" },
    { label: "Tổng đánh giá", suffix: "bài" },
    { label: "Đã xác thực", suffix: "bài" },
    { label: "Hữu ích", suffix: "lượt" },
  ],

  summary: {
    subtitle: "Tổng quan",
    title: "Xếp hạng & phân bố sao",
    liveBadge: "Live",
    basedOnPrefix: "Dựa trên ",
    basedOnSuffix: " đánh giá.",
    writeBtn: "Viết đánh giá",
    distTitle: "Phân bố theo sao",
    prototypeNote: "Prototype: Khi có backend, bạn lưu review theo “serviceId/productId”, trạng thái “verified”, và moderation.",
  },

  list: {
    subtitle: "Danh sách",
    title: "Đánh giá mới nhất",
    description: "Lọc theo sao, dịch vụ/sản phẩm, từ khóa. Like “Hữu ích” để ưu tiên hiển thị.",
    actions: ["Viết đánh giá", "Xoá demo"],

    filters: {
      searchLabel: "Tìm kiếm",
      searchPlaceholder: "VD: facial, massage, serum...",

      categoryLabel: "Danh mục",
      categoryOptions: ["Tất cả", "Dịch vụ", "Sản phẩm"],

      sortLabel: "Sắp xếp",
      sortOptions: ["Mới nhất", "Hữu ích nhất", "Sao cao → thấp", "Sao thấp → cao"],

      actions: ["Lọc", "Reset"],

      starChips: ["Tất cả", "5 sao", "4 sao", "3 sao", "2 sao", "1 sao"],
      verifiedTogglePrefix: "Verified:",
      verifiedOn: "ON",
      verifiedOff: "OFF",
    },

    emptyState: {
      title: "Chưa có đánh giá phù hợp",
      description: "Thử thay đổi bộ lọc hoặc viết đánh giá mới.",
      resetBtn: "Reset bộ lọc",
    },
  },

  reviewCard: {
    badgeService: "Dịch vụ",
    badgeProduct: "Sản phẩm",
    badgeVerified: "Đã xác thực",
    save: "Lưu",
    saved: "Đã lưu",
    helpful: "Hữu ích",
    report: "Báo cáo",
    reportAlertTemplate: "Đã gửi báo cáo (demo). ReviewID: {id}",
    replyTitleTemplate: "{brand} phản hồi",

    defaultAnonymous: "Ẩn danh",
    defaultCustomer: "Khách hàng",
  },

  faq: {
    subtitle: "FAQ",
    title: "Câu hỏi thường gặp",
    items: [
      {
        q: "Đánh giá “Đã xác thực” là gì?",
        a: "Đây là badge mô phỏng cho khách hàng có đơn hàng/đặt lịch thành công. Khi có backend, bạn xác thực theo orderId/bookingId.",
      },
      {
        q: "Tại sao có nút “Hữu ích”?",
        a: "Like “Hữu ích” giúp sắp xếp review theo chất lượng nội dung và độ tin cậy (signal).",
      },
      {
        q: "Có kiểm duyệt không?",
        a: "Nên có: lọc từ nhạy cảm, spam, kiểm tra ảnh. Trạng thái gợi ý: pending/approved/rejected.",
      },
      {
        q: "Có thể phản hồi review?",
        a: "Có. Nên cho “AYANAVITA Reply” để xử lý khiếu nại, nâng trải nghiệm và tăng uy tín.",
      },
    ],
  },

  stickyCta: {
    write: "Viết đánh giá",
    saved: "Đã lưu",
  },

  drawer: {
    subtitle: "Saved",
    title: "Đánh giá đã lưu",
    close: "Đóng",
    prototypeNote: "Prototype: lưu danh sách “saved reviews” bằng localStorage để người dùng xem lại.",
    listTitle: "Danh sách",
    clear: "Xoá",
    emptyTitle: "Chưa có mục đã lưu",
    emptyDescription: "Nhấn “Lưu” ở một review để thấy nó xuất hiện tại đây.",
    unsave: "Bỏ lưu",
  },

  modal: {
    subtitle: "Write",
    title: "Viết đánh giá",
    close: "Đóng",

    fields: {
      nameLabel: "Họ và tên",
      namePlaceholder: "Nguyễn Văn A",

      categoryLabel: "Danh mục",
      categoryOptions: ["Dịch vụ", "Sản phẩm"],

      itemLabel: "Tên dịch vụ/sản phẩm",
      itemPlaceholder: "VD: Facial Luxury, Serum AYA...",

      branchLabel: "Chi nhánh (tuỳ chọn)",
      branchPlaceholder: "VD: Q.1 / Hà Nội...",

      starsLabel: "Chấm sao",
      starsHint: "Chọn 1–5 sao.",

      contentLabel: "Nội dung đánh giá",
      contentPlaceholder: "Chia sẻ trải nghiệm...",

      imageLabel: "Ảnh minh hoạ (demo)",
      imageHint: "Ảnh chỉ preview trong trình duyệt, không upload server.",
      imagePreviewTitle: "Preview ảnh",

      verifiedLabel: "Đã xác thực (demo)",
      anonymousLabel: "Ẩn danh",
    },

    submit: "Gửi",
  },

  system: {
    confirmClearDemo: "Xoá toàn bộ dữ liệu review demo + localStorage?",
    validationMissingFields: "Vui lòng nhập Họ tên, Tên mục và Nội dung.",

    demoFill: {
      name: "Lê Hữu (Demo)",
      item: "Body Detox 60 phút",
      branch: "Q.1",
      text:
          "Không gian rất sạch, kỹ thuật viên làm đều tay, cảm giác thư giãn. Hỗ trợ đặt lịch nhanh. Đề xuất thêm gói membership.",
    },
  },
} as const;


type CmsData = typeof cmsDataDefault;

function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: any): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) return (patch ?? base) as T;

  const out: Record<string, any> = { ...(base as any) };
  for (const k of Object.keys(patch)) {
    const pv = (patch as any)[k];
    const bv = (base as any)[k];
    if (Array.isArray(pv)) out[k] = pv; // mảng: ghi đè toàn bộ
    else if (isPlainObject(pv) && isPlainObject(bv)) out[k] = deepMerge(bv, pv);
    else if (pv !== undefined) out[k] = pv;
  }
  return out as T;
}

function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold " + className}>{children}</span>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
      <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
      />
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
      <select
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
  );
}

function formatDateVi(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function ReviewsCenterPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [voteMap, setVoteMap] = useState<Record<string, boolean>>({});

  // CMS data (fetch từ backend theo ngôn ngữ)
  const [cmsData, setCmsData] = useState<CmsData>(() => cmsDataDefault);

  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  // Lắng nghe sự kiện thay đổi ngôn ngữ
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  // Load CMS theo ngôn ngữ hiện tại và ghi đè lên cmsData
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await http.get(`/public/pages/reviews?lang=${currentLanguage}`);
        const payload = res.data.sections[0].data;
        if (!alive || !payload) return;

        setCmsData((prev) => deepMerge(prev, payload));
      } catch (err) {
        // Không làm sập UI nếu CMS lỗi
        console.error("Failed to load reviews CMS data:", err);
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentLanguage]);



  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [filters, setFilters] = useState<ReviewsState>({
    q: "",
    category: "all",
    sort: "new",
    star: "all",
    verifiedOnly: false,
  });

  // form state
  const [fName, setFName] = useState("");
  const [fCat, setFCat] = useState<ReviewCategory>("service");
  const [fItem, setFItem] = useState("");
  const [fBranch, setFBranch] = useState("");
  const [fText, setFText] = useState("");
  const [fVerified, setFVerified] = useState(false);
  const [fAnonymous, setFAnonymous] = useState(false);
  const [pickedStars, setPickedStars] = useState(5);
  const [imgPreview, setImgPreview] = useState(
      "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1200&q=80"
  );

  useEffect(() => {
    ensureSeed();
    setReviews(loadReviews());
    setSavedIds(loadSavedIds());
    setVoteMap(loadVoteMap());
  }, []);

  useEffect(() => {
    // lock scroll when modal/drawer open
    document.body.style.overflow = modalOpen || drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen, drawerOpen]);

  const stats = useMemo(() => calcStats(reviews), [reviews]);

  const filtered = useMemo(() => {
    const arr = reviews.filter((r) => matches(r, filters));
    return sortReviews(arr, filters.sort);
  }, [reviews, filters]);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  function toggleSave(id: string) {
    const next = savedSet.has(id) ? savedIds.filter((x) => x !== id) : [id, ...savedIds];
    setSavedIds(next);
    saveSavedIds(next);
  }

  function toggleHelpful(id: string) {
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx < 0) return;

    const voted = !!voteMap[id];
    const nextMap = { ...voteMap, [id]: !voted };
    const next = [...reviews];
    next[idx] = {
      ...next[idx],
      helpful: voted ? Math.max(0, (next[idx].helpful || 0) - 1) : (next[idx].helpful || 0) + 1,
    };

    setVoteMap(nextMap);
    setReviews(next);
    saveVoteMap(nextMap);
    saveReviews(next);
  }

  function resetFilters() {
    setFilters({ q: "", category: "all", sort: "new", star: "all", verifiedOnly: false });
  }

  function clearDemo() {
    if (!confirm(cmsData.system.confirmClearDemo)) return;
    clearAllDemo();
    ensureSeed();
    const r = loadReviews();
    setReviews(r);
    setSavedIds(loadSavedIds());
    setVoteMap(loadVoteMap());
    resetFilters();
  }

  function openWrite() {
    setModalOpen(true);
  }

  function demoFill() {
    setFName(cmsData.system.demoFill.name);
    setFCat("service");
    setFItem(cmsData.system.demoFill.item);
    setFBranch(cmsData.system.demoFill.branch);
    setPickedStars(5);
    setFText(cmsData.system.demoFill.text);
    setFVerified(true);
    setFAnonymous(false);
  }

  function submitReview() {
    const name = fName.trim();
    const item = fItem.trim();
    const text = fText.trim();
    if (!name || !item || !text) {
      alert(cmsData.system.validationMissingFields);
      return;
    }

    const review: Review = {
      id: "RV-" + Math.random().toString(16).slice(2, 8).toUpperCase(),
      name,
      anonymous: fAnonymous,
      category: fCat,
      item,
      branch: fBranch.trim(),
      rating: pickedStars,
      text,
      img: imgPreview,
      verified: fVerified,
      helpful: 0,
      createdAt: new Date().toISOString(),
    };

    const next = [review, ...reviews];
    setReviews(next);
    saveReviews(next);

    // close
    setModalOpen(false);

    // reset form (optional)
    setFName("");
    setFItem("");
    setFBranch("");
    setFText("");
    setFVerified(false);
    setFAnonymous(false);
    setPickedStars(5);
  }

  function onFileChange(file?: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgPreview(url);
  }

  const avgStars = starIconsCount(stats.avg);

  return (
      <AppShell>
        {/* HERO */}
        <section className={LUX_BG}>
          <div className="absolute inset-0">
            <img
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=2200&q=80"
                className="w-full h-full object-cover opacity-55"
                alt="Spa"
            />
          </div>

          <Container className="relative py-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-5 items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  {cmsData.hero.chips.map((t) => (
                      <Chip key={t} className="bg-white/10 border-white/15 text-white">
                        {t}
                      </Chip>
                  ))}
                </div>

                <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold leading-tight">
                  {cmsData.hero.titleParts[0]}
                  <span className="text-amber-300">{cmsData.hero.titleParts[1]}</span>
                </h1>

                <p className="mt-4 text-white/90 text-lg leading-relaxed">
                  {cmsData.hero.descriptionParts[0]}
                  <b>{cmsData.hero.descriptionParts[1]}</b>
                  {cmsData.hero.descriptionParts[2]}
                  <b>{cmsData.hero.descriptionParts[3]}</b>
                  {cmsData.hero.descriptionParts[4]}
                </p>

                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Button
                      tone="accent"
                      variant="solid"
                      onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    {cmsData.hero.actions[0]}
                  </Button>
                  <Button tone="brand" variant="solid" onClick={openWrite}>
                    {cmsData.hero.actions[1]}
                  </Button>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="bg-white/10 border-white/15 text-white">
                    <div className="p-4">
                      <div className="text-xs font-extrabold text-white/70">{cmsData.statsCards[0].label}</div>
                      <div className="text-2xl font-extrabold">{stats.avg ? stats.avg.toFixed(1) : "—"}</div>
                      <div className="text-xs text-white/70 mt-1">{cmsData.statsCards[0].suffix}</div>
                    </div>
                  </Card>
                  <Card className="bg-white/10 border-white/15 text-white">
                    <div className="p-4">
                      <div className="text-xs font-extrabold text-white/70">{cmsData.statsCards[1].label}</div>
                      <div className="text-2xl font-extrabold">{stats.count || "—"}</div>
                      <div className="text-xs text-white/70 mt-1">{cmsData.statsCards[1].suffix}</div>
                    </div>
                  </Card>
                  <Card className="bg-white/10 border-white/15 text-white">
                    <div className="p-4">
                      <div className="text-xs font-extrabold text-white/70">{cmsData.statsCards[2].label}</div>
                      <div className="text-2xl font-extrabold">{stats.verified || "—"}</div>
                      <div className="text-xs text-white/70 mt-1">{cmsData.statsCards[2].suffix}</div>
                    </div>
                  </Card>
                  <Card className="bg-white/10 border-white/15 text-white">
                    <div className="p-4">
                      <div className="text-xs font-extrabold text-white/70">{cmsData.statsCards[3].label}</div>
                      <div className="text-2xl font-extrabold">{stats.helpful || "—"}</div>
                      <div className="text-xs text-white/70 mt-1">{cmsData.statsCards[3].suffix}</div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Summary Card */}
              <Card className="p-6" id="summary">
                <div className="flex items-center justify-between">
                  <div>
                    <SubTitle>{cmsData.summary.subtitle}</SubTitle>
                    <div className="text-xl font-extrabold text-slate-800">{cmsData.summary.title}</div>
                  </div>
                  <Badge tone="brand">{cmsData.summary.liveBadge}</Badge>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4 items-start">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl font-extrabold text-amber-500">{stats.avg ? stats.avg.toFixed(1) : "—"}</div>
                      <div className="flex-1">
                        <StarsRow value={avgStars} size="lg" />
                        <div className="text-sm text-slate-600 mt-1">
                          {cmsData.summary.basedOnPrefix}
                          <b>{stats.count || "—"}</b>
                          {cmsData.summary.basedOnSuffix}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button tone="brand" variant="solid" className="w-full" onClick={openWrite}>
                        {cmsData.summary.writeBtn}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-extrabold text-slate-800">{cmsData.summary.distTitle}</div>

                    <div className="mt-3 grid gap-2 text-amber-500">
                      {([5, 4, 3, 2, 1] as const).map((k) => {
                        const v = stats.dist[k] || 0;
                        const max = Math.max(1, ...Object.values(stats.dist));
                        const pct = Math.round((v / max) * 100);
                        return (
                            <button
                                key={k}
                                className="w-full text-left rounded-2xl hover:bg-slate-50 p-2 transition"
                                onClick={() => setFilters((p) => ({ ...p, star: String(k) as any }))}
                                type="button"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-10 font-extrabold">{k}★</div>
                                <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                                  <div className="h-2 rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="w-10 text-right text-sm text-slate-600">{v}</div>
                              </div>
                            </button>
                        );
                      })}
                    </div>

                    <Hr className="mt-4" />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">{cmsData.summary.prototypeNote}</div>
              </Card>
            </div>
          </Container>
        </section>

        {/* LIST + FILTERS */}
        <section id="reviews">
          <Container className="py-16">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <SubTitle>{cmsData.list.subtitle}</SubTitle>
                <Title className="mt-1">{cmsData.list.title}</Title>
                <p className="mt-2 text-slate-600">{cmsData.list.description}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button tone="brand" variant="solid" onClick={openWrite}>
                  {cmsData.list.actions[0]}
                </Button>
                <Button variant="ghost" onClick={clearDemo}>
                  {cmsData.list.actions[1]}
                </Button>
              </div>
            </div>

            <Card className="mt-6 p-6">
              <div className="grid lg:grid-cols-12 gap-3 items-end">
                <div className="lg:col-span-4">
                  <div className="text-sm font-extrabold text-slate-700">{cmsData.list.filters.searchLabel}</div>
                  <div className="mt-2">
                    <Input value={filters.q} onChange={(v) => setFilters((p) => ({ ...p, q: v }))} placeholder={cmsData.list.filters.searchPlaceholder} />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="text-sm font-extrabold text-slate-700">{cmsData.list.filters.categoryLabel}</div>
                  <div className="mt-2">
                    <Select value={filters.category} onChange={(v) => setFilters((p) => ({ ...p, category: v as any }))}>
                      <option value="all">{cmsData.list.filters.categoryOptions[0]}</option>
                      <option value="service">{cmsData.list.filters.categoryOptions[1]}</option>
                      <option value="product">{cmsData.list.filters.categoryOptions[2]}</option>
                    </Select>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="text-sm font-extrabold text-slate-700">{cmsData.list.filters.sortLabel}</div>
                  <div className="mt-2">
                    <Select value={filters.sort} onChange={(v) => setFilters((p) => ({ ...p, sort: v as any }))}>
                      <option value="new">{cmsData.list.filters.sortOptions[0]}</option>
                      <option value="helpful">{cmsData.list.filters.sortOptions[1]}</option>
                      <option value="high">{cmsData.list.filters.sortOptions[2]}</option>
                      <option value="low">{cmsData.list.filters.sortOptions[3]}</option>
                    </Select>
                  </div>
                </div>

                <div className="lg:col-span-2 flex gap-2">
                  <Button tone="brand" variant="solid" className="flex-1" onClick={() => {
                    /* state already live */
                  }}>
                    {cmsData.list.filters.actions[0]}
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={resetFilters}>
                    {cmsData.list.filters.actions[1]}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(["all", "5", "4", "3", "2", "1"] as const).map((s, idx) => (
                    <button
                        key={s}
                        className={
                            "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold " +
                            (filters.star === s
                                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50")
                        }
                        onClick={() => setFilters((p) => ({ ...p, star: s }))}
                        type="button"
                    >
                      {cmsData.list.filters.starChips[idx]}
                    </button>
                ))}

                <button
                    className={
                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold " +
                        (filters.verifiedOnly
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50")
                    }
                    onClick={() => setFilters((p) => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
                    type="button"
                >
                  {cmsData.list.filters.verifiedTogglePrefix} {filters.verifiedOnly ? cmsData.list.filters.verifiedOn : cmsData.list.filters.verifiedOff}
                </button>
              </div>
            </Card>

            {/* Grid */}
            {filtered.length === 0 ? (
                <Card className="mt-10 p-8 text-center">
                  <div className="text-xl font-extrabold">{cmsData.list.emptyState.title}</div>
                  <div className="mt-2 text-slate-600">{cmsData.list.emptyState.description}</div>
                  <Button tone="brand" variant="solid" className="mt-4" onClick={resetFilters}>
                    {cmsData.list.emptyState.resetBtn}
                  </Button>
                </Card>
            ) : (
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  {filtered.map((r) => {
                    const displayName = r.anonymous ? cmsData.reviewCard.defaultAnonymous : r.name || cmsData.reviewCard.defaultCustomer;
                    const savedOn = savedSet.has(r.id);
                    const voted = !!voteMap[r.id];

                    return (
                        <Card key={r.id} className="overflow-hidden card flex flex-col h-full">
                          <div className="relative">
                            <img src={r.img} alt={r.item} className="w-full h-44 object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 to-transparent" />
                            <div className="absolute left-4 bottom-4 flex flex-wrap gap-2">
                              <Badge tone={r.category === "service" ? "brand" : "accent"}>
                                {r.category === "service" ? cmsData.reviewCard.badgeService : cmsData.reviewCard.badgeProduct}
                              </Badge>
                              {r.verified && <Badge tone="success">{cmsData.reviewCard.badgeVerified}</Badge>}
                              <Badge tone="accent">{r.rating}.0</Badge>
                            </div>
                          </div>

                          <div className="p-6 flex flex-col flex-1">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-lg font-extrabold">{r.item}</div>
                                  <div className="text-sm text-slate-600 mt-1">
                                    <b>{displayName}</b> {r.branch ? `• ${r.branch}` : ""} • <Muted>{formatDateVi(r.createdAt)}</Muted>
                                  </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    title={cmsData.reviewCard.save}
                                    className={savedOn ? "border-indigo-200 bg-indigo-50 text-indigo-700" : ""}
                                    onClick={() => toggleSave(r.id)}
                                >
                                  {savedOn ? cmsData.reviewCard.saved : cmsData.reviewCard.save}
                                </Button>
                              </div>

                              <div className="mt-3">
                                <StarsRow value={r.rating} />
                              </div>

                              <p className="mt-3 text-slate-700 leading-relaxed whitespace-pre-line">{r.text}</p>

                              {r.reply && (
                                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                    <div className="text-sm font-extrabold text-slate-800">
                                      {interpolate(cmsData.reviewCard.replyTitleTemplate, { brand: cmsData.brandName })}
                                    </div>
                                    <div className="text-sm text-slate-700 mt-2 whitespace-pre-line">{r.reply.text}</div>
                                  </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-6">
                              <Button tone={voted ? "brand" : "muted"} variant={voted ? "solid" : "ghost"} onClick={() => toggleHelpful(r.id)}>
                                {cmsData.reviewCard.helpful} ({r.helpful || 0})
                              </Button>
                              <Button
                                  variant="ghost"
                                  onClick={() => alert(interpolate(cmsData.reviewCard.reportAlertTemplate, { id: r.id }))}
                              >
                                {cmsData.reviewCard.report}
                              </Button>
                            </div>
                          </div>
                        </Card>
                    );
                  })}
                </div>
            )}
          </Container>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50">
          <Container className="py-16">
            <SubTitle>{cmsData.faq.subtitle}</SubTitle>
            <Title className="mt-1">{cmsData.faq.title}</Title>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {cmsData.faq.items.map((x) => (
                  <Card key={x.q} className="p-6">
                    <div className="font-extrabold">{x.q}</div>
                    <div className="mt-2 text-slate-600 text-sm">{x.a}</div>
                  </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Sticky CTA mobile */}
        <div className="fixed left-0 right-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-slate-200 p-3 md:hidden">
          <Container className="px-2 flex items-center gap-2">
            <Button tone="brand" variant="solid" className="flex-1" onClick={openWrite}>
              {cmsData.stickyCta.write}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setDrawerOpen(true)}>
              {cmsData.stickyCta.saved}
            </Button>
          </Container>
        </div>

        {/* Drawer */}
        {drawerOpen && (
            <>
              <div className="fixed inset-0 bg-black/55 z-40" onClick={() => setDrawerOpen(false)} />
              <aside className="fixed top-0 right-0 h-full w-[min(420px,92vw)] bg-white z-50 border-l border-slate-200 shadow-[-18px_0_60px_rgba(2,6,23,0.12)]">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <SubTitle>{cmsData.drawer.subtitle}</SubTitle>
                    <div className="text-lg font-extrabold">{cmsData.drawer.title}</div>
                  </div>
                  <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                    {cmsData.drawer.close}
                  </Button>
                </div>

                <div className="p-6">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">{cmsData.drawer.prototypeNote}</div>

                  <Hr className="mt-5" />

                  <div className="mt-5 flex items-center justify-between">
                    <div className="font-extrabold">{cmsData.drawer.listTitle}</div>
                    <Button
                        variant="ghost"
                        onClick={() => {
                          setSavedIds([]);
                          saveSavedIds([]);
                        }}
                    >
                      {cmsData.drawer.clear}
                    </Button>
                  </div>

                  {savedIds.length === 0 ? (
                      <div className="mt-10 text-center text-slate-600">
                        <div className="mt-2 font-extrabold">{cmsData.drawer.emptyTitle}</div>
                        <div className="text-sm mt-1">{cmsData.drawer.emptyDescription}</div>
                      </div>
                  ) : (
                      <div className="mt-4 grid gap-3">
                        {savedIds
                            .map((id) => reviews.find((r) => r.id === id))
                            .filter(Boolean)
                            .map((r) => (
                                <div key={r!.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-extrabold">{r!.item}</div>
                                      <div className="text-sm text-slate-600 mt-1">
                                        {(r!.anonymous ? cmsData.reviewCard.defaultAnonymous : r!.name) + " • " + r!.rating + "★"}
                                      </div>
                                    </div>
                                    <Button variant="ghost" onClick={() => toggleSave(r!.id)}>
                                      {cmsData.drawer.unsave}
                                    </Button>
                                  </div>
                                  <div className="mt-3 text-sm text-slate-700 line-clamp-2 whitespace-pre-line">{r!.text}</div>
                                </div>
                            ))}
                      </div>
                  )}
                </div>
              </aside>
            </>
        )}

        {/* Modal */}
        {modalOpen && (
            <div
                className="fixed inset-0 z-100 bg-black/55 flex items-start justify-center p-4 overflow-y-auto"
                onClick={() => setModalOpen(false)}
                style={{ paddingTop: "70px", paddingBottom: "20px" }}
            >
              <div className="w-full max-w-3xl my-0" onClick={(e) => e.stopPropagation()}>
                <Card className="overflow-hidden flex flex-col max-h-[calc(100vh-90px)]">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
                    <div>
                      <SubTitle>{cmsData.modal.subtitle}</SubTitle>
                      <div className="text-lg font-extrabold">{cmsData.modal.title}</div>
                    </div>
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>
                      {cmsData.modal.close}
                    </Button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-slate-700">{cmsData.modal.fields.nameLabel}</div>
                          <div className="mt-2">
                            <Input value={fName} onChange={setFName} placeholder={cmsData.modal.fields.namePlaceholder} />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-700">{cmsData.modal.fields.categoryLabel}</div>
                          <div className="mt-2">
                            <Select value={fCat} onChange={(v) => setFCat(v as any)}>
                              <option value="service">{cmsData.modal.fields.categoryOptions[0]}</option>
                              <option value="product">{cmsData.modal.fields.categoryOptions[1]}</option>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-slate-700">{cmsData.modal.fields.itemLabel}</div>
                          <div className="mt-2">
                            <Input value={fItem} onChange={setFItem} placeholder={cmsData.modal.fields.itemPlaceholder} />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-700">{cmsData.modal.fields.branchLabel}</div>
                          <div className="mt-2">
                            <Input value={fBranch} onChange={setFBranch} placeholder={cmsData.modal.fields.branchPlaceholder} />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="text-sm font-extrabold text-slate-700">{cmsData.modal.fields.starsLabel}</div>
                        <StarPicker value={pickedStars} onChange={setPickedStars} />
                        <div className="text-sm text-slate-600 mt-1">{cmsData.modal.fields.starsHint}</div>
                      </div>

                      <div>
                        <div className="text-sm font-extrabold text-slate-700">{cmsData.modal.fields.contentLabel}</div>
                        <textarea
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-400"
                            rows={4}
                            value={fText}
                            onChange={(e) => setFText(e.target.value)}
                            placeholder={cmsData.modal.fields.contentPlaceholder}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 items-start">
                        <div>
                          <div className="text-sm font-extrabold text-slate-700">{cmsData.modal.fields.imageLabel}</div>
                          <input
                              type="file"
                              accept="image/*"
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                              onChange={(e) => onFileChange(e.target.files?.[0])}
                          />
                          <div className="text-xs text-slate-500 mt-2">{cmsData.modal.fields.imageHint}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <div className="text-sm font-extrabold">{cmsData.modal.fields.imagePreviewTitle}</div>
                          <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                            <img alt="preview" className="w-full h-40 object-cover" src={imgPreview} />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold">
                          <input type="checkbox" checked={fVerified} onChange={(e) => setFVerified(e.target.checked)} />
                          {cmsData.modal.fields.verifiedLabel}
                        </label>
                        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold">
                          <input type="checkbox" checked={fAnonymous} onChange={(e) => setFAnonymous(e.target.checked)} />
                          {cmsData.modal.fields.anonymousLabel}
                        </label>
                      </div>

                      <div className="flex gap-2">
                        {/*
                      <Button tone="accent" variant="solid" className="flex-1" onClick={demoFill}>
                        Demo
                      </Button>
                    */}
                        <Button tone="brand" variant="solid" className="flex-1" onClick={submitReview}>
                          {cmsData.modal.submit}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
        )}
      </AppShell>
  );
}
