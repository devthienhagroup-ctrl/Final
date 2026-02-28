import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/http";

// ==================== KIỂU DỮ LIỆU ====================
type ReviewVisibility = "visible" | "hidden";
type ReviewFlag = "none" | "spam";
type Rating = 1 | 2 | 3 | 4 | 5;
type ReviewImage = { id: string; url: string };
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  lastOrderCode: string;
  lastOrderAt: string; // YYYY-MM-DD
  note?: string;
};
type ReviewedEntityType = "product" | "service";
type ReviewedEntity = {
  type: ReviewedEntityType;
  sku?: string;
  name: string;
  image: string;
  category: string;
};
type PurchaseInfo = {
  orderCode: string;
  purchasedAt: string; // YYYY-MM-DD
  branch: string;
  paymentMethod: string;
};
type ModerationLog = {
  at: string; // YYYY-MM-DD HH:mm
  by: string;
  action:
    | "CREATE"
    | "SHOW"
    | "HIDE"
    | "FLAG_SPAM"
    | "UNFLAG_SPAM"
    | "DELETE"
    | "NOTE_UPDATE";
  note?: string;
};
type Review = {
  id: string;
  createdAt: string; // YYYY-MM-DD
  createdTime: string; // HH:mm
  verifiedPurchase: true;
  isAnonymous: boolean;
  entity: ReviewedEntity;
  rating: Rating;
  title: string;
  content: string;
  images: ReviewImage[];
  customer: Customer;
  purchase: PurchaseInfo;
  visibility: ReviewVisibility;
  flag: ReviewFlag;
  helpfulUp: number;
  helpfulDown: number;
  staffNote: string;
  logs: ModerationLog[];
};

type ApiReview = {
  id: string | number;
  createdAt?: string;
  type?: "PRODUCT" | "SERVICE";
  isAnonymous?: boolean;
  stars?: number;
  comment?: string;
  images?: Array<{ id?: string | number; imageUrl?: string }>;
  visibility?: "VISIBLE" | "HIDDEN" | "DELETED";
  customerName?: string | null;
  branch?: { name?: string };
  service?: { name?: string } | null;
  product?: { sku?: string; translations?: Array<{ name?: string }> } | null;
  user?: { id?: string | number; name?: string | null; email?: string | null } | null;
};

function mapApiReview(row: ApiReview): Review {
  const created = row.createdAt ? new Date(row.createdAt) : new Date();
  const yyyy = String(created.getFullYear());
  const mm = String(created.getMonth() + 1).padStart(2, "0");
  const dd = String(created.getDate()).padStart(2, "0");
  const hh = String(created.getHours()).padStart(2, "0");
  const min = String(created.getMinutes()).padStart(2, "0");
  const productName = row.product?.translations?.[0]?.name || "Sản phẩm";
  const entityName = row.type === "PRODUCT" ? productName : row.service?.name || "Dịch vụ";

  return {
    id: String(row.id),
    createdAt: `${yyyy}-${mm}-${dd}`,
    createdTime: `${hh}:${min}`,
    verifiedPurchase: true,
    isAnonymous: !!row.isAnonymous,
    entity: {
      type: row.type === "PRODUCT" ? "product" : "service",
      sku: row.product?.sku || undefined,
      name: entityName,
      image: row.images?.[0]?.imageUrl || IMG.spaService,
      category: row.type === "PRODUCT" ? "Sản phẩm" : "Dịch vụ Spa",
    },
    rating: Math.min(5, Math.max(1, Number(row.stars || 5))) as Rating,
    title:
      Number(row.stars || 0) >= 4
        ? "Rất hài lòng"
        : Number(row.stars || 0) <= 2
          ? "Không như kỳ vọng"
          : "Tạm ổn",
    content: row.comment || "",
    images: (row.images || []).map((img, idx) => ({
      id: String(img.id || `${row.id}-${idx}`),
      url: img.imageUrl || "",
    })),
    customer: {
      id: String(row.user?.id || `CUS-${row.id}`),
      name: row.customerName || row.user?.name || "Ẩn danh",
      email: row.user?.email || "",
      phone: "",
      city: "",
      totalOrders: 0,
      lastOrderCode: "",
      lastOrderAt: `${yyyy}-${mm}-${dd}`,
      note: "",
    },
    purchase: {
      orderCode: "",
      purchasedAt: `${yyyy}-${mm}-${dd}`,
      branch: row.branch?.name || "",
      paymentMethod: "",
    },
    visibility: row.visibility === "HIDDEN" ? "hidden" : "visible",
    flag: "none",
    helpfulUp: 0,
    helpfulDown: 0,
    staffNote: "",
    logs: [{ at: `${yyyy}-${mm}-${dd} ${hh}:${min}`, by: "System", action: "CREATE" }],
  };
}

// ==================== DỮ LIỆU MẪU (ảnh) ====================
const IMG = {
  serum:
    "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=200&q=70",
  sunscreen:
    "https://images.unsplash.com/photo-1620916566393-c52f8a4baf1b?auto=format&fit=crop&w=200&q=70",
  toner:
    "https://images.unsplash.com/photo-1612810430211-7b1b9ac2f1b5?auto=format&fit=crop&w=200&q=70",
  cream:
    "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=200&q=70",
  mask:
    "https://images.unsplash.com/photo-1615396899839-c99c121e0b9d?auto=format&fit=crop&w=200&q=70",
  cleanser:
    "https://images.unsplash.com/photo-1619979427927-33a9f2e302d3?auto=format&fit=crop&w=200&q=70",
  spaService:
    "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=200&q=70",
};

const REVIEW_PHOTOS = [
  "https://images.unsplash.com/photo-1556228724-4b59d07840d4?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1585232351009-aa87416fca90?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&w=900&q=70",
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function formatMoney(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}
function fmtDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
}

type SortKey = "newest" | "oldest" | "lowestRating" | "highestRating" | "mostHelpful";

export function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  // filters
  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState("2026-02-01");
  const [toDate, setToDate] = useState("2026-02-28");
  const [ratingMin, setRatingMin] = useState<number | "">("");
  const [ratingMax, setRatingMax] = useState<number | "">("");
  const [visibility, setVisibility] = useState<ReviewVisibility | "all">("all");
  const [hasImages, setHasImages] = useState<"all" | "yes" | "no">("all");
  const [anonymousOnly, setAnonymousOnly] = useState(false);
  const [spamOnly, setSpamOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // selection (bulk)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // drawer + lightbox
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Review | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const confirmActionRef = useRef<null | (() => void)>(null);

  // loading + toast
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  // lock background scroll while drawer is open
  const scrollYRef = useRef(0);

  // ===== THÊM FONTAWESOME =====
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    fakeRefresh();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const fd = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const td = toDate ? new Date(toDate + "T23:59:59") : null;

    const rMin = ratingMin === "" ? null : Number(ratingMin);
    const rMax = ratingMax === "" ? null : Number(ratingMax);

    const rows = reviews.filter((rv) => {
      if (!rv.verifiedPurchase) return false;

      if (query) {
        const hay = [
          rv.id,
          rv.purchase.orderCode,
          rv.entity.name,
          rv.entity.sku || "",
          rv.customer.name,
          rv.customer.email,
          rv.title,
          rv.content,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(query)) return false;
      }

      const dt = new Date(`${rv.createdAt}T${rv.createdTime}:00`);
      if (fd && dt < fd) return false;
      if (td && dt > td) return false;

      if (rMin !== null && rv.rating < rMin) return false;
      if (rMax !== null && rv.rating > rMax) return false;

      if (visibility !== "all" && rv.visibility !== visibility) return false;

      const hasImg = (rv.images || []).some((x) => !!x.url);
      if (hasImages === "yes" && !hasImg) return false;
      if (hasImages === "no" && hasImg) return false;

      if (anonymousOnly && !rv.isAnonymous) return false;
      if (spamOnly && rv.flag !== "spam") return false;

      return true;
    });

    const sorted = [...rows].sort((a, b) => {
      const aKey = `${a.createdAt} ${a.createdTime}`;
      const bKey = `${b.createdAt} ${b.createdTime}`;
      if (sortKey === "newest") return aKey < bKey ? 1 : -1;
      if (sortKey === "oldest") return aKey > bKey ? 1 : -1;
      if (sortKey === "lowestRating") return a.rating - b.rating;
      if (sortKey === "highestRating") return b.rating - a.rating;
      // mostHelpful
      const ah = (a.helpfulUp || 0) - (a.helpfulDown || 0);
      const bh = (b.helpfulUp || 0) - (b.helpfulDown || 0);
      return bh - ah;
    });

    return sorted;
  }, [reviews, q, fromDate, toDate, ratingMin, ratingMax, visibility, hasImages, anonymousOnly, spamOnly, sortKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

  const pageRows = useMemo(() => {
    const p = clamp(page, 1, totalPages);
    const start = (p - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize, totalPages]);

  const pagerInfo = useMemo(() => {
    const total = filtered.length;
    const p = Math.min(Math.max(1, page), totalPages);
    const start = (p - 1) * pageSize;
    const end = start + pageSize;
    const showingFrom = total === 0 ? 0 : start + 1;
    const showingTo = Math.min(end, total);
    return `Hiển thị ${showingFrom}-${showingTo} / ${total} • Trang ${p}/${totalPages}`;
  }, [filtered.length, page, pageSize, totalPages]);

  function toast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 1600);
  }

  function openConfirm(title: string, desc: string, onConfirm: () => void) {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    confirmActionRef.current = onConfirm;
    setConfirmOpen(true);
  }

  async function fakeRefresh() {
    setLoading(true);
    try {
      const rows = await api<ApiReview[]>("/reviews/admin/list");
      setReviews((rows || []).map(mapApiReview));
      toast("Đã tải lại dữ liệu.");
    } catch (e: any) {
      toast(e?.message || "Tải danh sách thất bại");
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQ("");
    setFromDate("2026-02-01");
    setToDate("2026-02-28");
    setRatingMin("");
    setRatingMax("");
    setVisibility("all");
    setHasImages("all");
    setAnonymousOnly(false);
    setSpamOnly(false);
    setSortKey("newest");
    setPage(1);
    toast("Đã reset bộ lọc");
  }

  function openDrawer(rv: Review) {
    setSelected(rv);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setLightboxUrl(null);
  }

  // lock scroll
  useEffect(() => {
    if (!drawerOpen) return;

    scrollYRef.current = window.scrollY || 0;
    const body = document.body;

    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [drawerOpen]);

  async function toggleVisibility(id: string) {
    const rv = reviews.find((x) => x.id === id);
    if (!rv) return;

    if (rv.visibility === "visible") {
      try {
        await api(`/reviews/admin/${Number(id)}/hide`, { method: "PATCH" });
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, visibility: "hidden" } : r)));
        toast("Đã ẩn đánh giá.");
      } catch (e: any) {
        toast(e?.message || "Ẩn đánh giá thất bại");
      }
      return;
    }

    toast("Backend hiện chỉ hỗ trợ thao tác ẩn/xóa.");
  }

  function toggleSpamFlag(id: string) {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next: ReviewFlag = r.flag === "spam" ? "none" : "spam";
        const action = next === "spam" ? "FLAG_SPAM" : "UNFLAG_SPAM";
        return {
          ...r,
          flag: next,
          visibility: next === "spam" ? "hidden" : r.visibility,
          logs: [
            ...r.logs,
            {
              at: `${r.createdAt} ${r.createdTime}`,
              by: "Admin",
              action: action as any,
              note: next === "spam" ? "Gắn spam và ẩn tự động (demo)." : "Bỏ spam (demo).",
            },
          ],
        };
      }),
    );
    toast("Đã cập nhật spam (demo).");
  }

  function updateStaffNote(id: string, note: string) {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          staffNote: note,
          logs: [
            ...r.logs,
            { at: `${r.createdAt} ${r.createdTime}`, by: "Admin", action: "NOTE_UPDATE", note: "Cập nhật ghi chú nội bộ." },
          ],
        };
      }),
    );
    toast("Đã lưu ghi chú (demo).");
  }

  function deleteReview(id: string) {
    openConfirm(
      "Xóa đánh giá",
      "Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa đánh giá này?",
      async () => {
        try {
          await api(`/reviews/admin/${Number(id)}`, { method: "DELETE" });
          setReviews((prev) => prev.filter((r) => r.id !== id));
          setSelectedIds((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          if (selected?.id === id) closeDrawer();
          toast("Đã xóa đánh giá.");
        } catch (e: any) {
          toast(e?.message || "Xóa đánh giá thất bại");
        }
      },
    );
  }

  function setAllOnPage(checked: boolean) {
    const ids = pageRows.map((r) => r.id);
    setSelectedIds((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = checked));
      return next;
    });
  }

  const selectedOnPage = useMemo(
    () => pageRows.filter((r) => selectedIds[r.id]).map((r) => r.id),
    [pageRows, selectedIds],
  );
  const allOnPageChecked = useMemo(
    () => pageRows.length > 0 && pageRows.every((r) => !!selectedIds[r.id]),
    [pageRows, selectedIds],
  );

  function bulkAction(kind: "show" | "hide" | "spam" | "unspam" | "delete") {
    const ids = selectedOnPage;
    if (ids.length === 0) return toast("Chưa chọn dòng nào.");

    const label =
      kind === "show"
        ? "Hiện"
        : kind === "hide"
          ? "Ẩn"
          : kind === "spam"
            ? "Gắn spam"
            : kind === "unspam"
              ? "Bỏ spam"
              : "Xóa";

    openConfirm(
      `${label} hàng loạt`,
      `Bạn chắc chắn muốn "${label}" ${ids.length} đánh giá đã chọn?`,
      async () => {
        if (kind === "delete") {
          // gọi API delete từng cái (đơn giản, tránh thay đổi lớn)
          for (const id of ids) {
            try {
              await api(`/reviews/admin/${Number(id)}`, { method: "DELETE" });
            } catch {}
          }
          setReviews((prev) => prev.filter((r) => !ids.includes(r.id)));
          setSelectedIds((prev) => {
            const next = { ...prev };
            ids.forEach((id) => delete next[id]);
            return next;
          });
          toast("Đã xóa các đánh giá đã chọn.");
          return;
        }

        // các action khác vẫn demo/local như cũ
        if (kind === "hide") ids.forEach((id) => toggleVisibility(id));
        if (kind === "spam") ids.forEach((id) => toggleSpamFlag(id));
        if (kind === "unspam") ids.forEach((id) => toggleSpamFlag(id));
        if (kind === "show") toast("Backend hiện chỉ hỗ trợ thao tác ẩn/xóa.");
      },
    );
  }

  // ==================== UI (phần JSX giữ nguyên như file của bạn) ====================
  // NOTE: Mình giữ nguyên mọi phần render/markup còn lại để đúng patch,
  // chỉ thay logic data source + API actions theo diff bạn đưa.

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== TOP BAR ===== */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center font-black">
                <i className="fa-solid fa-star" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900">Reviews Admin</div>
                <div className="text-xs text-slate-500">{pagerInfo}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-60"
                onClick={fakeRefresh}
                disabled={loading}
                title="Tải lại"
              >
                <i className={"fa-solid fa-rotate " + (loading ? "animate-spin" : "")} />{" "}
                {loading ? "Đang tải..." : "Refresh"}
              </button>

              <button
                className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                onClick={resetFilters}
                title="Reset"
              >
                <i className="fa-solid fa-filter-circle-xmark" /> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* ===== FILTERS ===== */}
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-extrabold text-slate-600">Tìm kiếm</div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Mã review, order, tên SP/DV, email..."
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-extrabold text-slate-600">Từ ngày</div>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-extrabold text-slate-600">Đến ngày</div>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-extrabold text-slate-600">Rating min</div>
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
              value={ratingMin}
              onChange={(e) => {
                setRatingMin(e.target.value === "" ? "" : Number(e.target.value));
                setPage(1);
              }}
              min={1}
              max={5}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-extrabold text-slate-600">Rating max</div>
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
              value={ratingMax}
              onChange={(e) => {
                setRatingMax(e.target.value === "" ? "" : Number(e.target.value));
                setPage(1);
              }}
              min={1}
              max={5}
            />
          </div>

          <div className="md:col-span-6 grid grid-cols-1 gap-3 md:grid-cols-6">
            <div>
              <div className="mb-1 text-xs font-extrabold text-slate-600">Hiển thị</div>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
                value={visibility}
                onChange={(e) => {
                  setVisibility(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="all">Tất cả</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <div className="mb-1 text-xs font-extrabold text-slate-600">Có ảnh</div>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
                value={hasImages}
                onChange={(e) => {
                  setHasImages(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="all">Tất cả</option>
                <option value="yes">Có</option>
                <option value="no">Không</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={anonymousOnly}
                  onChange={(e) => {
                    setAnonymousOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                Ẩn danh
              </label>
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={spamOnly}
                  onChange={(e) => {
                    setSpamOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                Spam
              </label>
            </div>

            <div>
              <div className="mb-1 text-xs font-extrabold text-slate-600">Sort</div>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="highestRating">Rating cao</option>
                <option value="lowestRating">Rating thấp</option>
                <option value="mostHelpful">Hữu ích</option>
              </select>
            </div>

            <div>
              <div className="mb-1 text-xs font-extrabold text-slate-600">Page size</div>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ===== BULK ACTIONS ===== */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={allOnPageChecked} onChange={(e) => setAllOnPage(e.target.checked)} />
              Chọn trang
            </label>

            <button
              className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
              onClick={() => bulkAction("hide")}
            >
              <i className="fa-solid fa-eye-slash" /> Ẩn
            </button>
            <button
              className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
              onClick={() => bulkAction("spam")}
            >
              <i className="fa-solid fa-triangle-exclamation" /> Spam
            </button>
            <button
              className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
              onClick={() => bulkAction("delete")}
            >
              <i className="fa-solid fa-trash" /> Xóa
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
              onClick={() => setPage((p) => clamp(p - 1, 1, totalPages))}
              disabled={page <= 1}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            <div className="text-sm font-extrabold text-slate-700">
              Trang {page}/{totalPages}
            </div>
            <button
              className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
              onClick={() => setPage((p) => clamp(p + 1, 1, totalPages))}
              disabled={page >= totalPages}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Chọn</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Khách</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((rv) => {
                const hasImg = (rv.images || []).some((x) => !!x.url);
                const score = (rv.helpfulUp || 0) - (rv.helpfulDown || 0);
                return (
                  <tr key={rv.id} className="border-t">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[rv.id]}
                        onChange={(e) => setSelectedIds((prev) => ({ ...prev, [rv.id]: e.target.checked }))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-900">{fmtDate(rv.createdAt)}</div>
                      <div className="text-xs text-slate-500">{rv.createdTime}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={rv.entity.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
                        <div>
                          <div className="font-extrabold text-slate-900">{rv.entity.name}</div>
                          <div className="text-xs text-slate-500">
                            {rv.entity.type.toUpperCase()} {rv.entity.sku ? `• ${rv.entity.sku}` : ""} • {rv.entity.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-900">{rv.customer.name}</div>
                      <div className="text-xs text-slate-500">{rv.customer.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-black text-slate-900">{rv.rating}</div>
                        <div className="text-xs text-slate-500">• Helpful {score}</div>
                      </div>
                      <div className="text-xs text-slate-500">{rv.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold " +
                          (rv.visibility === "visible" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700")
                        }
                      >
                        <i className={"fa-solid " + (rv.visibility === "visible" ? "fa-eye" : "fa-eye-slash")} />
                        {rv.visibility}
                      </div>
                      {rv.flag === "spam" ? (
                        <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-700">
                          <i className="fa-solid fa-triangle-exclamation" /> spam
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {hasImg ? (
                        <div className="flex -space-x-2">
                          {(rv.images || []).slice(0, 3).map((img) => (
                            <button
                              key={img.id}
                              className="h-8 w-8 overflow-hidden rounded-xl border bg-white"
                              onClick={() => setLightboxUrl(img.url)}
                              title="Xem ảnh"
                            >
                              <img src={img.url} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Không</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold hover:bg-slate-50"
                          onClick={() => openDrawer(rv)}
                        >
                          <i className="fa-solid fa-up-right-from-square" /> Chi tiết
                        </button>
                        <button
                          className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold hover:bg-slate-50"
                          onClick={() => toggleVisibility(rv.id)}
                        >
                          <i className="fa-solid fa-eye-slash" /> Ẩn
                        </button>
                        <button
                          className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold hover:bg-slate-50"
                          onClick={() => toggleSpamFlag(rv.id)}
                        >
                          <i className="fa-solid fa-triangle-exclamation" /> Spam
                        </button>
                        <button
                          className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold hover:bg-slate-50"
                          onClick={() => deleteReview(rv.id)}
                        >
                          <i className="fa-solid fa-trash" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pageRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={8}>
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== DRAWER ===== */}
      {drawerOpen && selected ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="font-extrabold text-slate-900">Chi tiết review • {selected.id}</div>
              <button className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50" onClick={closeDrawer}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="h-[calc(100%-56px)] overflow-auto p-4">
              <div className="flex items-center gap-3">
                <img src={selected.entity.image} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                <div>
                  <div className="font-extrabold text-slate-900">{selected.entity.name}</div>
                  <div className="text-xs text-slate-500">
                    {selected.entity.type.toUpperCase()} {selected.entity.sku ? `• ${selected.entity.sku}` : ""} •{" "}
                    {selected.entity.category}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border bg-slate-50 p-3">
                  <div className="text-xs font-extrabold text-slate-600">Ngày</div>
                  <div className="font-extrabold text-slate-900">
                    {fmtDate(selected.createdAt)} • {selected.createdTime}
                  </div>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-3">
                  <div className="text-xs font-extrabold text-slate-600">Rating</div>
                  <div className="font-extrabold text-slate-900">{selected.rating} / 5</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border p-3">
                <div className="text-xs font-extrabold text-slate-600">Nội dung</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{selected.content || "(trống)"}</div>
              </div>

              <div className="mt-4 rounded-2xl border p-3">
                <div className="text-xs font-extrabold text-slate-600">Ghi chú nội bộ</div>
                <textarea
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-200"
                  value={selected.staffNote}
                  rows={3}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelected((prev) => (prev ? { ...prev, staffNote: v } : prev));
                    updateStaffNote(selected.id, v);
                  }}
                />
              </div>

              <div className="mt-4 rounded-2xl border p-3">
                <div className="text-xs font-extrabold text-slate-600">Logs</div>
                <div className="mt-2 space-y-2">
                  {(selected.logs || []).map((lg, idx) => (
                    <div key={idx} className="rounded-xl border bg-slate-50 p-2 text-xs">
                      <div className="font-extrabold text-slate-800">
                        {lg.at} • {lg.by} • {lg.action}
                      </div>
                      {lg.note ? <div className="text-slate-600">{lg.note}</div> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                  onClick={() => toggleVisibility(selected.id)}
                >
                  <i className="fa-solid fa-eye-slash" /> Ẩn
                </button>
                <button
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                  onClick={() => toggleSpamFlag(selected.id)}
                >
                  <i className="fa-solid fa-triangle-exclamation" /> Spam
                </button>
                <button
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                  onClick={() => deleteReview(selected.id)}
                >
                  <i className="fa-solid fa-trash" /> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ===== LIGHTBOX ===== */}
      {lightboxUrl ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" className="max-h-[85vh] max-w-[92vw] rounded-2xl object-contain" />
        </div>
      ) : null}

      {/* ===== CONFIRM MODAL ===== */}
      {confirmOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
            <div className="text-lg font-extrabold text-slate-900">{confirmTitle}</div>
            <div className="mt-1 text-sm text-slate-600">{confirmDesc}</div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                onClick={() => setConfirmOpen(false)}
              >
                Hủy
              </button>
              <button
                className="rounded-xl border bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
                onClick={() => {
                  setConfirmOpen(false);
                  confirmActionRef.current?.();
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ===== TOAST ===== */}
      {toastMsg ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-extrabold text-white shadow-xl">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}