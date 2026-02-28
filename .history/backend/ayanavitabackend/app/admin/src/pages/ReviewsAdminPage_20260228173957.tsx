import React, { useEffect, useMemo, useRef, useState } from "react";

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
  | "HIDE"
  | "SHOW"
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

// ==================== DỮ LIỆU MẪU ====================
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

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function fmtDate(yyyy_mm_dd: string) {
  const [y, m, d] = yyyy_mm_dd.split("-");
  return `${d}/${m}/${y}`;
}
function nowTimeLike() {
  const hh = String(Math.floor(8 + Math.random() * 12)).padStart(2, "0");
  const mm = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  return `${hh}:${mm}`;
}
function makeId(prefix: string) {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}
function stars(r: number) {
  const full = "★".repeat(clamp(r, 0, 5));
  const empty = "☆".repeat(clamp(5 - r, 0, 5));
  return full + empty;
}
function toCSVCell(v: string) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function seedReviews(): Review[] {
  const staff = ["An", "Bình", "Châu", "Dũng", "Hạnh", "Khang", "Linh"];
  const branches = ["CN Quận 1", "CN Quận 7", "CN Thủ Đức", "CN Bình Thạnh"];
  const payMethods = ["Chuyển khoản", "COD", "Ví điện tử", "Thẻ"];
  const cities = ["TP.HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương", "Đồng Nai"];

  const entities: ReviewedEntity[] = [
    { type: "product", sku: "AYA-SUN-50", name: "Kem chống nắng SPF50", image: IMG.sunscreen, category: "Chống nắng" },
    { type: "product", sku: "AYA-SERUM-VC", name: "Serum Vitamin C", image: IMG.serum, category: "Serum" },
    { type: "product", sku: "AYA-TONER-H", name: "Toner cấp ẩm", image: IMG.toner, category: "Toner" },
    { type: "product", sku: "AYA-CREAM-R", name: "Kem dưỡng phục hồi", image: IMG.cream, category: "Kem dưỡng" },
    { type: "product", sku: "AYA-MASK-N", name: "Mặt nạ ngủ", image: IMG.mask, category: "Mặt nạ" },
    { type: "product", sku: "AYA-CLEAN-01", name: "Sữa rửa mặt dịu nhẹ", image: IMG.cleanser, category: "Làm sạch" },
    { type: "service", name: "Liệu trình chăm sóc da cơ bản", image: IMG.spaService, category: "Dịch vụ Spa" },
  ];

  const customerBase: Omit<Customer, "id" | "lastOrderCode" | "lastOrderAt">[] = [
    { name: "Lan Nguyễn", email: "lan.nguyen@gmail.com", phone: "0903 111 222", city: pick(cities), totalOrders: 4 },
    { name: "Minh Phạm", email: "minh.pham@outlook.com", phone: "0988 220 101", city: pick(cities), totalOrders: 2 },
    { name: "Hà Trần", email: "ha.tran@gmail.com", phone: "0912 777 123", city: pick(cities), totalOrders: 1 },
    { name: "Tuấn Lê", email: "tuan.le@gmail.com", phone: "0938 666 555", city: pick(cities), totalOrders: 6 },
    { name: "Vy Đặng", email: "vy.dang@gmail.com", phone: "0967 321 999", city: pick(cities), totalOrders: 3 },
    { name: "Khoa Nguyễn", email: "khoa.nguyen@gmail.com", phone: "0909 888 777", city: pick(cities), totalOrders: 8 },
    { name: "Thảo Phan", email: "thao.phan@gmail.com", phone: "0971 333 444", city: pick(cities), totalOrders: 2 },
    { name: "Huy Trần", email: "huy.tran@yahoo.com", phone: "0918 222 333", city: pick(cities), totalOrders: 5 },
    { name: "Trang Lâm", email: "trang.lam@gmail.com", phone: "0902 456 789", city: pick(cities), totalOrders: 7 },
    { name: "Đức Võ", email: "duc.vo@gmail.com", phone: "0931 999 111", city: pick(cities), totalOrders: 1 },
    { name: "Nhi Lê", email: "nhi.le@gmail.com", phone: "0907 202 303", city: pick(cities), totalOrders: 4 },
    { name: "Phong Đỗ", email: "phong.do@gmail.com", phone: "0966 808 909", city: pick(cities), totalOrders: 3 },
  ];

  const badSnippets = [
    "Hàng không giống mô tả, mùi hơi khó chịu.",
    "Gây rát nhẹ lúc bôi, da mình không hợp.",
    "Đóng gói ổn nhưng dùng không thấy hiệu quả.",
    "Bị vón khi thoa, phải dưỡng kỹ mới ổn.",
    "Dịch vụ hơi vội, tư vấn chưa kỹ.",
  ];
  const goodSnippets = [
    "Dùng 1 tuần thấy da mịn hơn, thấm nhanh.",
    "Đúng hàng, đóng gói chắc chắn, giao nhanh.",
    "Mùi dễ chịu, không nhờn rít, hợp da dầu.",
    "Tư vấn tận tình, liệu trình dễ chịu.",
    "Hài lòng, sẽ mua lại lần sau.",
  ];
  const neutralSnippets = [
    "Ổn trong tầm giá, cần thêm thời gian để đánh giá.",
    "Chất lượng ok, nhưng mình thích kết cấu mỏng hơn.",
    "Giao hàng nhanh, sản phẩm dùng được.",
    "Dịch vụ ổn, phòng sạch sẽ.",
  ];

  const days = Array.from({ length: 28 }, (_, i) => `2026-02-${String(i + 1).padStart(2, "0")}`);

  const rows: Review[] = [];
  const total = 46;

  for (let i = 0; i < total; i++) {
    const entity = pick(entities);
    const base = pick(customerBase);
    const orderCode = "OD-" + String(1001 + Math.floor(Math.random() * 280)).padStart(4, "0");
    const purchasedAt = pick(days);
    const createdAt = pick(days);

    const roll = Math.random();
    const rating: Rating = (roll < 0.12
      ? 1
      : roll < 0.22
        ? 2
        : roll < 0.42
          ? 3
          : roll < 0.72
            ? 4
            : 5) as Rating;

    const isAnonymous = Math.random() < 0.18;
    const hasImages = Math.random() < 0.38;
    const imagesCount = hasImages ? (Math.random() < 0.45 ? 1 : Math.random() < 0.8 ? 2 : 3) : 0;

    const visibility: ReviewVisibility = Math.random() < 0.14 ? "hidden" : "visible";
    const flag: ReviewFlag = Math.random() < 0.08 ? "spam" : "none";

    const textPool = rating <= 2 ? badSnippets : rating === 3 ? neutralSnippets : goodSnippets;

    const customer: Customer = {
      id: makeId("CUS"),
      ...base,
      lastOrderCode: orderCode,
      lastOrderAt: purchasedAt,
      note: "",
    };

    const createdTime = nowTimeLike();

    const logs: ModerationLog[] = [
      { at: `${createdAt} ${createdTime}`, by: "System", action: "CREATE" },
    ];

    if (visibility === "hidden") {
      logs.push({
        at: `${createdAt} ${createdTime}`,
        by: pick(staff),
        action: "HIDE",
        note: "Ẩn theo quy định kiểm duyệt (demo).",
      });
    }
    if (flag === "spam") {
      logs.push({
        at: `${createdAt} ${createdTime}`,
        by: pick(staff),
        action: "FLAG_SPAM",
        note: "Phát hiện nội dung lặp/đặt link (demo).",
      });
    }

    rows.push({
      id: makeId("RV"),
      createdAt,
      createdTime,
      verifiedPurchase: true,
      isAnonymous,
      entity,
      rating,
      title:
        rating <= 2
          ? "Không như kỳ vọng"
          : rating === 3
            ? "Tạm ổn"
            : "Rất hài lòng",
      content: pick(textPool),
      images: Array.from({ length: imagesCount }, (_, k) => ({
        id: makeId("IMG"),
        url: REVIEW_PHOTOS[(i + k) % REVIEW_PHOTOS.length],
      })),
      customer,
      purchase: {
        orderCode,
        purchasedAt,
        branch: pick(branches),
        paymentMethod: pick(payMethods),
      },
      visibility,
      flag,
      helpfulUp: Math.floor(Math.random() * 28),
      helpfulDown: Math.floor(Math.random() * 9),
      staffNote: "",
      logs,
    });
  }

  rows.unshift({
    id: "RV-000001",
    createdAt: "2026-02-26",
    createdTime: "21:12",
    verifiedPurchase: true,
    isAnonymous: true,
    entity: { type: "product", sku: "AYA-SUN-50", name: "Kem chống nắng SPF50", image: IMG.sunscreen, category: "Chống nắng" },
    rating: 1,
    title: "Spam nội dung lặp",
    content: "Mua đi mọi người!!! link... link... (demo spam)",
    images: [{ id: "IMG-EDGE-1", url: REVIEW_PHOTOS[0] }],
    customer: {
      id: "CUS-EDGE-1",
      name: "Ẩn danh",
      email: "hidden@anon.com",
      phone: "0000 000 000",
      city: "TP.HCM",
      totalOrders: 1,
      lastOrderCode: "OD-1999",
      lastOrderAt: "2026-02-25",
      note: "",
    },
    purchase: { orderCode: "OD-1999", purchasedAt: "2026-02-25", branch: "CN Quận 1", paymentMethod: "Chuyển khoản" },
    visibility: "hidden",
    flag: "spam",
    helpfulUp: 0,
    helpfulDown: 3,
    staffNote: "Khóa hiển thị do spam (demo).",
    logs: [
      { at: "2026-02-26 21:12", by: "System", action: "CREATE" },
      { at: "2026-02-26 21:14", by: "An", action: "FLAG_SPAM", note: "Nội dung lặp/đặt link." },
      { at: "2026-02-26 21:15", by: "An", action: "HIDE", note: "Ẩn để tránh spam." },
    ],
  });

  return rows.sort((a, b) => (a.createdAt === b.createdAt ? (a.createdTime < b.createdTime ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1));
}

type SortKey = "newest" | "oldest" | "lowestRating" | "highestRating" | "mostHelpful";

export function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>(seedReviews());

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

      const created = new Date(rv.createdAt + "T12:00:00");
      if (fd && created < fd) return false;
      if (td && created > td) return false;

      if (rMin !== null && rv.rating < rMin) return false;
      if (rMax !== null && rv.rating > rMax) return false;

      if (visibility !== "all" && rv.visibility !== visibility) return false;

      if (hasImages !== "all") {
        const yes = rv.images.length > 0;
        if (hasImages === "yes" && !yes) return false;
        if (hasImages === "no" && yes) return false;
      }

      if (anonymousOnly && !rv.isAnonymous) return false;
      if (spamOnly && rv.flag !== "spam") return false;

      return true;
    });

    const sorted = rows.slice().sort((a, b) => {
      const aKey = `${a.createdAt} ${a.createdTime}`;
      const bKey = `${b.createdAt} ${b.createdTime}`;

      if (sortKey === "newest") return aKey < bKey ? 1 : -1;
      if (sortKey === "oldest") return aKey > bKey ? 1 : -1;
      if (sortKey === "lowestRating") return a.rating === b.rating ? (aKey < bKey ? 1 : -1) : a.rating - b.rating;
      if (sortKey === "highestRating") return a.rating === b.rating ? (aKey < bKey ? 1 : -1) : b.rating - a.rating;
      const aHelp = a.helpfulUp - a.helpfulDown;
      const bHelp = b.helpfulUp - b.helpfulDown;
      return aHelp === bHelp ? (aKey < bKey ? 1 : -1) : bHelp - aHelp;
    });

    return sorted;
  }, [reviews, q, fromDate, toDate, ratingMin, ratingMax, visibility, hasImages, anonymousOnly, spamOnly, sortKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const p = Math.min(Math.max(1, page), totalPages);
    const start = (p - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize, totalPages]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const visibleCount = filtered.filter((r) => r.visibility === "visible").length;
    const hiddenCount = filtered.filter((r) => r.visibility === "hidden").length;
    const spamCount = filtered.filter((r) => r.flag === "spam").length;
    const withImages = filtered.filter((r) => r.images.length > 0).length;
    const anonymous = filtered.filter((r) => r.isAnonymous).length;

    const avg = total ? filtered.reduce((s, r) => s + r.rating, 0) / total : 0;

    const dist = [1, 2, 3, 4, 5].map((k) => filtered.filter((r) => r.rating === k).length);

    return { total, visibleCount, hiddenCount, spamCount, withImages, anonymous, avg, dist };
  }, [filtered]);

  const topBadProducts = useMemo(() => {
    const map = new Map<
      string,
      { key: string; name: string; sku?: string; image: string; count: number; sum: number; badCount: number }
    >();

    reviews
      .filter((r) => r.flag !== "spam" && r.entity.type === "product")
      .forEach((r) => {
        const k = r.entity.sku || r.entity.name;
        const cur =
          map.get(k) ||
          ({
            key: k,
            name: r.entity.name,
            sku: r.entity.sku,
            image: r.entity.image,
            count: 0,
            sum: 0,
            badCount: 0,
          } as any);
        cur.count += 1;
        cur.sum += r.rating;
        if (r.rating <= 2) cur.badCount += 1;
        map.set(k, cur);
      });

    const arr = Array.from(map.values())
      .map((x) => ({
        ...x,
        avg: x.count ? x.sum / x.count : 0,
        badRate: x.count ? Math.round((x.badCount / x.count) * 100) : 0,
      }))
      .filter((x) => x.count >= 3)
      .sort((a, b) => (a.avg === b.avg ? b.count - a.count : a.avg - b.avg))
      .slice(0, 6);

    return arr;
  }, [reviews]);

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

  function fakeRefresh() {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      toast("Refresh xong (demo).");
    }, 650);
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (lightboxUrl) setLightboxUrl(null);
        else closeDrawer();
        setConfirmOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

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

  function toggleVisibility(id: string) {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next: ReviewVisibility = r.visibility === "visible" ? "hidden" : "visible";
        const action = next === "hidden" ? "HIDE" : "SHOW";
        const by = "Admin";
        return {
          ...r,
          visibility: next,
          logs: [
            ...r.logs,
            {
              at: `${r.createdAt} ${r.createdTime}`,
              by,
              action: action as any,
              note: next === "hidden" ? "Ẩn để kiểm duyệt (demo)." : "Hiện lại sau kiểm duyệt (demo).",
            },
          ],
        };
      }),
    );
    toast("Đã cập nhật ẩn/hiện (demo).");
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
      () => {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setSelectedIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        if (selected?.id === id) closeDrawer();
        toast("Đã xóa đánh giá (demo).");
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

  const selectedOnPage = useMemo(() => pageRows.filter((r) => selectedIds[r.id]).map((r) => r.id), [pageRows, selectedIds]);
  const allOnPageChecked = useMemo(() => pageRows.length > 0 && pageRows.every((r) => !!selectedIds[r.id]), [pageRows, selectedIds]);

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
      `Thao tác hàng loạt: ${label}`,
      `Áp dụng cho ${ids.length} đánh giá đang chọn. Bạn chắc chắn chứ?`,
      () => {
        if (kind === "delete") {
          setReviews((prev) => prev.filter((r) => !ids.includes(r.id)));
          setSelectedIds((prev) => {
            const next = { ...prev };
            ids.forEach((id) => delete next[id]);
            return next;
          });
          if (selected && ids.includes(selected.id)) closeDrawer();
          toast("Đã xóa hàng loạt (demo).");
          return;
        }

        setReviews((prev) =>
          prev.map((r) => {
            if (!ids.includes(r.id)) return r;

            if (kind === "show") {
              return { ...r, visibility: "visible", logs: [...r.logs, { at: `${r.createdAt} ${r.createdTime}`, by: "Admin", action: "SHOW" }] };
            }
            if (kind === "hide") {
              return { ...r, visibility: "hidden", logs: [...r.logs, { at: `${r.createdAt} ${r.createdTime}`, by: "Admin", action: "HIDE" }] };
            }
            if (kind === "spam") {
              return {
                ...r,
                flag: "spam",
                visibility: "hidden",
                logs: [...r.logs, { at: `${r.createdAt} ${r.createdTime}`, by: "Admin", action: "FLAG_SPAM" }],
              };
            }
            return { ...r, flag: "none", logs: [...r.logs, { at: `${r.createdAt} ${r.createdTime}`, by: "Admin", action: "UNFLAG_SPAM" }] };
          }),
        );

        toast(`Đã ${label.toLowerCase()} ${ids.length} đánh giá (demo).`);
      },
    );
  }

  function exportCSV() {
    const headers = [
      "review_id",
      "created_at",
      "order_code",
      "entity_type",
      "sku",
      "entity_name",
      "rating",
      "visibility",
      "flag",
      "anonymous",
      "images",
      "customer_name",
      "customer_email",
      "customer_phone",
      "content",
    ];

    const lines = [headers.join(",")];

    filtered.forEach((r) => {
      lines.push(
        [
          r.id,
          `${r.createdAt} ${r.createdTime}`,
          r.purchase.orderCode,
          r.entity.type,
          r.entity.sku || "",
          r.entity.name,
          String(r.rating),
          r.visibility,
          r.flag,
          r.isAnonymous ? "1" : "0",
          String(r.images.length),
          r.isAnonymous ? "Ẩn danh" : r.customer.name,
          r.isAnonymous ? "" : r.customer.email,
          r.isAnonymous ? "" : r.customer.phone,
          r.content,
        ]
          .map(toCSVCell)
          .join(","),
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast("Đã export CSV (demo).");
  }

  async function copyText(v: string) {
    try {
      await navigator.clipboard.writeText(v);
      toast("Đã copy");
    } catch {
      toast("Không copy được (trình duyệt chặn).");
    }
  }

  const tabCounts = useMemo(() => {
    const all = reviews.length;
    const visible = reviews.filter((r) => r.visibility === "visible").length;
    const hidden = reviews.filter((r) => r.visibility === "hidden").length;
    const spam = reviews.filter((r) => r.flag === "spam").length;
    const anonymous = reviews.filter((r) => r.isAnonymous).length;
    return { all, visible, hidden, spam, anonymous };
  }, [reviews]);

  const activeTab = useMemo(() => {
    if (spamOnly) return "spam";
    if (anonymousOnly) return "anonymous";
    if (visibility === "visible") return "visible";
    if (visibility === "hidden") return "hidden";
    return "all";
  }, [spamOnly, anonymousOnly, visibility]);

  function setTab(key: "all" | "visible" | "hidden" | "spam" | "anonymous") {
    setPage(1);
    if (key === "all") {
      setVisibility("all");
      setSpamOnly(false);
      setAnonymousOnly(false);
      return;
    }
    if (key === "visible") {
      setVisibility("visible");
      setSpamOnly(false);
      setAnonymousOnly(false);
      return;
    }
    if (key === "hidden") {
      setVisibility("hidden");
      setSpamOnly(false);
      setAnonymousOnly(false);
      return;
    }
    if (key === "spam") {
      setSpamOnly(true);
      setVisibility("all");
      setAnonymousOnly(false);
      return;
    }
    setAnonymousOnly(true);
    setSpamOnly(false);
    setVisibility("all");
  }

  return (
    <div className="ar-reviews">
      <style>{`
        .ar-reviews {
          --bg: #ffffff;
          --text: #0f172a;
          --muted: #64748b;
          --border: rgba(15, 23, 42, 0.08);
          --shadow: 0 20px 45px rgba(2, 6, 23, 0.12);
          --shadow-soft: 0 12px 28px rgba(2, 6, 23, 0.08);
          --radius: 18px;
          --grad: linear-gradient(135deg, #7c3aed, #06b6d4);
          --grad-2: linear-gradient(135deg, #22c55e, #06b6d4);
          --grad-warm: linear-gradient(135deg, #f97316, #ec4899);
          --warn: #f59e0b;
          --danger: #ef4444;
          --info: #2563eb;
          --chip-bg: rgba(2, 6, 23, 0.04);
          --focus: 0 0 0 4px rgba(124, 58, 237, 0.18);

          min-height: 100vh;
          color: var(--text);
          background-color: var(--bg);
          background-image:
            radial-gradient(1200px 600px at 20% -10%, rgba(124, 58, 237, 0.08), transparent 60%),
            radial-gradient(1200px 600px at 90% 0%, rgba(6, 182, 212, 0.08), transparent 55%);
          background-repeat: no-repeat;
          background-attachment: fixed;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
            "Apple Color Emoji", "Segoe UI Emoji";
        }

ar-bad-img-rv {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 12px;
}
        ar-bad-

        .ar-reviews * { box-sizing: border-box; }
        .ar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px;
          padding-bottom: 36px;
        }

        .ar-page-title {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          margin-top: 14px;
          margin-bottom: 18px;
        }
        .ar-page-title h2 { margin:0; font-size:22px; letter-spacing:-0.02em; }
        .ar-hint { margin:0; color:var(--muted); font-size:13px; }

        .ar-title-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }

        .ar-pill {
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:10px 12px;
          border:1px solid var(--border);
          border-radius:999px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 10px 20px rgba(2, 6, 23, 0.06);
          transition: transform .15s ease, box-shadow .15s ease;
          cursor:pointer;
          user-select:none;
        }
        .ar-pill:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
        .ar-pill:active { transform: translateY(0); }

        .ar-loading {
          display:none;
          align-items:center;
          gap:10px;
          color:var(--muted);
          font-size:12px;
        }
        .ar-loading.show { display:inline-flex; }
        .ar-spinner {
          width:14px;height:14px;border-radius:999px;
          border:2px solid rgba(15, 23, 42, 0.15);
          border-top-color: rgba(124, 58, 237, 0.8);
          animation: ar-spin .7s linear infinite;
        }
        @keyframes ar-spin { to{ transform: rotate(360deg); } }

        .ar-grid {
          display:grid;
          grid-template-columns: repeat(12, 1fr);
          gap:12px;
          margin-bottom:16px;
        }
        .ar-card {
          border:1px solid var(--border);
          border-radius: var(--radius);
          background: rgba(255,255,255,0.9);
          box-shadow: var(--shadow-soft);
        }

        .ar-stat {
          grid-column: span 3;
          padding:14px 14px 12px 14px;
          overflow:hidden;
          position:relative;
          transform: translateZ(0);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .ar-stat:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(2, 6, 23, 0.11); }
        .ar-stat-bg {
          position:absolute; inset:-1px;
          opacity:0.12;
          background: var(--grad);
          pointer-events:none;
        }
        .ar-stat:nth-child(2) .ar-stat-bg{ background: var(--grad-2); }
        .ar-stat:nth-child(3) .ar-stat-bg{ background: var(--grad-warm); }
        .ar-stat:nth-child(4) .ar-stat-bg{ background: linear-gradient(135deg, #2563eb, #7c3aed); }
        .ar-label{ margin:0 0 6px 0; font-size:12px; color:var(--muted); position:relative; }
        .ar-row{ position:relative; display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .ar-value{ margin:0; font-size:22px; font-weight:800; letter-spacing:-0.03em; }
        .ar-badge-mini{
          position:relative;
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:8px 10px;
          border-radius:999px;
          border:1px solid var(--border);
          background: rgba(255,255,255,0.85);
          font-size:12px;
          color: rgba(15, 23, 42, 0.85);
          white-space:nowrap;
        }
        .ar-spark{ width:10px;height:10px;border-radius:999px;background: var(--grad); }

        .ar-panel{ padding:14px; }
        .ar-panel-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom:10px;
          flex-wrap:wrap;
        }
        .ar-panel-head h3{ margin:0; font-size:14px; }
        .ar-panel-right{ display:flex; align-items:center; gap:10px; color:var(--muted); font-size:12px; flex-wrap:wrap; }

        .ar-filters{
          display:grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap:10px;
          align-items:end;
        }
        .ar-field label{
          display:block;
          font-size:12px;
          color:var(--muted);
          margin: 0 0 6px 2px;
        }
        .ar-input{
          width:100%;
          border-radius:14px;
          border:1px solid var(--border);
          background: rgba(255,255,255,0.9);
          padding:10px 12px;
          outline:none;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .ar-input:focus{
          box-shadow: var(--focus);
          border-color: rgba(124, 58, 237, 0.45);
        }

        .ar-actions{
          display:flex;
          gap:10px;
          justify-content:flex-end;
          margin-top:10px;
          flex-wrap:wrap;
        }
        .ar-btn{
          border:1px solid var(--border);
          background: rgba(255,255,255,0.9);
          color: var(--text);
          border-radius:14px;
          padding:10px 12px;
          cursor:pointer;
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
          display:inline-flex;
          align-items:center;
          gap:8px;
          user-select:none;
          white-space:nowrap;
        }
        .ar-btn:hover{ transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
        .ar-btn:active{ transform: translateY(0); }
        .ar-btn.primary{
          border:none;
          color:white;
          background: var(--grad);
          box-shadow: 0 16px 32px rgba(124, 58, 237, 0.18);
        }
        .ar-btn.danger{
          border:none;
          color:white;
          background: linear-gradient(135deg, #ef4444, #f97316);
          box-shadow: 0 16px 32px rgba(239, 68, 68, 0.16);
        }
        .ar-btn.ghost{ background: rgba(2, 6, 23, 0.02); }

        /* ===== TABS GỌN HƠN ===== */
        .ar-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 8px 12px;
          border-radius: 40px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.9);
          box-shadow: var(--shadow-soft);
          margin: 14px 0 12px 0;
        }
        .ar-tab {
          padding: 6px 14px;
          border-radius: 30px;
          border: 1px solid var(--border);
          background: rgba(2, 6, 23, 0.02);
          color: rgba(15, 23, 42, 0.86);
          font-size: 13px;
          cursor: pointer;
          user-select: none;
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ar-tab:hover { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(2, 6, 23, 0.08); }
        .ar-tab.active {
          background: rgba(124, 58, 237, 0.12);
          border-color: rgba(124, 58, 237, 0.35);
        }
        .ar-count {
          padding: 2px 8px;
          border-radius: 30px;
          background: rgba(255,255,255,0.9);
          border: 1px solid var(--border);
          font-size: 11px;
        }
        .ar-tabs-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ar-mini-label {
          font-size: 12px;
          color: var(--muted);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .ar-select {
          border-radius: 999px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.92);
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          transition: box-shadow .15s ease, border-color .15s ease;
          cursor: pointer;
        }
        .ar-select:focus { box-shadow: var(--focus); border-color: rgba(124, 58, 237, 0.45); }

        /* ===== TABLE ĐÃ TỐI ƯU ===== */
        .ar-table-wrap { overflow: hidden; }
        .ar-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .ar-table th {
          font-size: 12px;
          color: var(--muted);
          padding: 12px 8px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.9);
        }
        .ar-table td {
          padding: 12px 8px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          font-size: 13px;
          vertical-align: middle;
        }
        .ar-tbody tr { transition: background .15s ease; }
        .ar-tbody tr:nth-child(odd) { background: rgba(2, 6, 23, 0.012); }
        .ar-tbody tr:nth-child(even) { background: rgba(255, 255, 255, 0.9); }
        .ar-tbody tr:hover { background: rgba(124, 58, 237, 0.05); }

        .ar-product-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ar-product-info img {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid var(--border);
        }
        .ar-product-name {
          font-weight: 600;
          font-size: 13px;
        }
        .ar-product-sku {
          font-size: 11px;
          color: var(--muted);
        }

        .ar-review-summary {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ar-stars {
          color: #f59e0b;
          font-size: 12px;
          letter-spacing: 2px;
        }
        .ar-review-title {
          font-weight: 600;
          font-size: 13px;
          line-height: 1.3;
        }
        .ar-review-excerpt {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.4;
        }
        .ar-helpful {
          font-size: 11px;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ar-thumbnails {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .ar-thumb-sm {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: transform .1s ease;
        }
        .ar-thumb-sm:hover { transform: scale(1.05); }

        .ar-customer-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ar-customer-name {
          font-weight: 600;
          font-size: 13px;
        }
        .ar-customer-email {
          font-size: 11px;
          color: var(--muted);
        }

        .ar-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 500;
          background: var(--chip-bg);
          border: 1px solid var(--border);
        }
        .ar-badge.visible { background: rgba(34,197,94,0.1); color: #166534; border-color: #86efac; }
        .ar-badge.hidden { background: rgba(100,116,139,0.1); color: #334155; border-color: #cbd5e1; }
        .ar-badge.spam { background: rgba(239,68,68,0.1); color: #b91c1c; border-color: #fecaca; }

        .ar-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 12px;
        }
        .ar-sub { color: var(--muted); font-size: 12px; margin-top: 4px; }

        .ar-table-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ar-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.9);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .ar-icon-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
        .ar-icon-btn:active { transform: translateY(0); }

        .ar-pager {
          margin-top: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.9);
          box-shadow: var(--shadow-soft);
          flex-wrap: wrap;
        }
        .ar-pager-left { color: var(--muted); font-size: 12px; }
        .ar-pager-right { display: flex; align-items: center; gap: 8px; }
        .ar-page-btn {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.95);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform .15s ease, box-shadow .15s ease;
          user-select: none;
        }
        .ar-page-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
        .ar-page-btn:active { transform: translateY(0); }
        .ar-page-num {
          min-width: 44px;
          height: 40px;
          padding: 0 12px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(2, 6, 23, 0.02);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        .ar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.35);
          opacity: 0;
          pointer-events: none;
          transition: opacity .2s ease;
          z-index: 30;
        }
        .ar-overlay.show { opacity: 1; pointer-events: auto; }

        .ar-drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: min(45%, 560px);
          max-width: 92vw;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-left: 1px solid var(--border);
          box-shadow: var(--shadow);
          transform: translateX(102%);
          transition: transform .26s cubic-bezier(.2,.8,.2,1);
          z-index: 35;
          display: flex;
          flex-direction: column;
        }
        .ar-drawer.show { transform: translateX(0); }
        .ar-drawer-head {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .ar-drawer-title { display: flex; flex-direction: column; gap: 2px; }
        .ar-drawer-title h4 { margin:0; font-size:14px; }
        .ar-drawer-title p { margin:0; font-size:12px; color: var(--muted); }
        .ar-drawer-body { padding: 16px; overflow: auto; }

        .ar-section {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: rgba(255,255,255,0.9);
          box-shadow: var(--shadow-soft);
          padding: 14px;
          margin-bottom: 12px;
        }
        .ar-section h5 { margin:0 0 10px 0; font-size:13px; }
        .ar-kv {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .ar-k { color:var(--muted); font-size:12px; margin-bottom:4px; }
        .ar-v { font-size:13px; font-weight:800; }
        .ar-text {
          margin:0;
          font-size:13px;
          color: rgba(15, 23, 42, 0.9);
          line-height:1.5;
        }
        .ar-note {
          width:100%;
          border-radius:14px;
          border:1px solid var(--border);
          background: rgba(255,255,255,0.95);
          padding:10px 12px;
          outline:none;
          min-height: 86px;
          resize: vertical;
        }
        .ar-note:focus {
          box-shadow: var(--focus);
          border-color: rgba(124, 58, 237, 0.45);
        }
        .ar-log {
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:10px;
          padding:10px 0;
          border-top: 1px dashed rgba(15,23,42,0.10);
        }
        .ar-log:first-child{ border-top:none; padding-top:0; }
        .ar-log-meta{ color:var(--muted); font-size:12px; }
        .ar-log-action{ font-weight:900; font-size:12px; }

        /* Ảnh lớn hơn trong drawer */
        .ar-drawer .ar-thumbs img {
          width: 100px;
          height: 100px;
          border-radius: 12px;
          object-fit: cover;
          cursor: pointer;
          transition: transform .15s ease;
        }
        .ar-drawer .ar-thumbs img:hover { transform: scale(1.02); }
        .ar-drawer .ar-thumbs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ar-toast {
          position: fixed;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.92);
          color: white;
          padding: 10px 12px;
          border-radius: 999px;
          font-size: 12px;
          box-shadow: 0 18px 40px rgba(2,6,23,0.22);
          z-index: 60;
        }

        .ar-confirm {
          position: fixed; inset:0;
          display:none;
          align-items:center;
          justify-content:center;
          z-index: 55;
        }
        .ar-confirm.show{ display:flex; }
        .ar-confirm-card{
          width: min(520px, 92vw);
          border-radius: 20px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(10px);
          box-shadow: var(--shadow);
          padding: 14px;
        }
        .ar-confirm-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px; }
        .ar-confirm-head h4{ margin:0; font-size:14px; }
        .ar-confirm-desc{ margin:0 0 12px 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
        .ar-confirm-actions{ display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; }

        .ar-lightbox{
          position:fixed; inset:0;
          background: rgba(2,6,23,0.55);
          z-index: 70;
          display:none;
          align-items:center;
          justify-content:center;
          padding: 18px;
        }
        .ar-lightbox.show{ display:flex; }
        .ar-lightbox img{
          max-width: min(960px, 96vw);
          max-height: 88vh;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.22);
          box-shadow: 0 30px 80px rgba(2,6,23,0.35);
          object-fit: contain;
          background: rgba(255,255,255,0.06);
        }

        .ar-mini-table{
          width:100%;
          border-collapse:separate;
          border-spacing:0;
        }
        .ar-mini-table th{
          text-align:left;
          font-size:12px;
          color: var(--muted);
          padding:10px 12px;
          border-bottom:1px solid var(--border);
        }
        .ar-mini-table td{
          padding:10px 12px;
          border-bottom:1px solid rgba(15,23,42,0.06);
          font-size:13px;
          vertical-align:middle;
        }
        .ar-mini-table tr:hover td{ background: rgba(124, 58, 237, 0.04); }

        .ar-bar{
          height:10px;
          border-radius:999px;
          background: rgba(2,6,23,0.06);
          overflow:hidden;
          border: 1px solid rgba(15,23,42,0.06);
        }
        .ar-bar > i{
          display:block;
          height:100%;
          width: 0%;
          background: var(--grad);
        }

        @media (max-width: 980px){
          .ar-stat{ grid-column: span 6; }
          .ar-filters{ grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px){
          .ar-stat{ grid-column: span 12; }
          .ar-kv{ grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ar-container">
        <div className="ar-page-title">
          <div>
            <h2>Quản lý đánh giá khách hàng</h2>
            <p className="ar-hint">
              Chỉ hiển thị review từ khách <b>đã mua</b> • Có ảnh • Có ẩn danh • Nhân viên xem chi tiết để liên hệ
            </p>
          </div>
          <div className="ar-title-actions">
            <button className="ar-pill" onClick={fakeRefresh}>
              <i className="fas fa-sync-alt" /> Làm mới
            </button>
            <button className="ar-pill" onClick={exportCSV}>
              <i className="fas fa-download" /> Export CSV
            </button>
            <span className={`ar-loading ${loading ? "show" : ""}`}>
              <span className="ar-spinner" /> Đang tải…
            </span>
          </div>
        </div>

        {/* 4 thống kê nhanh */}
        <div className="ar-grid">
          <div className="ar-card ar-stat">
            <div className="ar-stat-bg" />
            <p className="ar-label">Tổng đánh giá (theo bộ lọc)</p>
            <div className="ar-row">
              <p className="ar-value">{stats.total}</p>
              <span className="ar-badge-mini"><span className="ar-spark" /> Verified purchase</span>
            </div>
          </div>
          <div className="ar-card ar-stat">
            <div className="ar-stat-bg" />
            <p className="ar-label">Điểm trung bình</p>
            <div className="ar-row">
              <p className="ar-value">{stats.avg.toFixed(2)}</p>
              <span className="ar-badge-mini"><span className="ar-spark" /> {stars(Math.round(stats.avg))}</span>
            </div>
          </div>
          <div className="ar-card ar-stat">
            <div className="ar-stat-bg" />
            <p className="ar-label">Hiển thị / Ẩn / Spam</p>
            <div className="ar-row">
              <p className="ar-value">{stats.visibleCount}/{stats.hiddenCount}/{stats.spamCount}</p>
              <span className="ar-badge-mini"><span className="ar-spark" /> Moderation</span>
            </div>
          </div>
          <div className="ar-card ar-stat">
            <div className="ar-stat-bg" />
            <p className="ar-label">Có ảnh / Ẩn danh</p>
            <div className="ar-row">
              <p className="ar-value">{stats.withImages}/{stats.anonymous}</p>
              <span className="ar-badge-mini"><span className="ar-spark" /> Media & Anon</span>
            </div>
          </div>

          {/* Top sản phẩm bị đánh giá tệ */}
          <div className="ar-card ar-panel" style={{ gridColumn: "span 7" }}>
            <div className="ar-panel-head">
              <h3>Top sản phẩm bị đánh giá tệ</h3>
              <div className="ar-panel-right">Tính trên toàn bộ dữ liệu (loại spam) • tối thiểu 3 review</div>
            </div>
            {topBadProducts.length === 0 ? (
              <p className="ar-hint">Chưa đủ dữ liệu để thống kê.</p>
            ) : (
              <table className="ar-mini-table">
                <thead><tr><th>Sản phẩm</th><th>Avg</th><th>Review</th><th>Tỷ lệ 1-2★</th></tr></thead>
                <tbody>
                  {topBadProducts.map(p => (
                    <tr key={p.key}>
                      <td>
                        <div className="ar-entity">
                          <img className="ar-bad-img-rv" src={p.image} alt={p.name} />
                          <div>
                            <div className="ar-entity-name">{p.name}</div>
                            <div className="ar-entity-meta">{p.sku || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 900 }}>{p.avg.toFixed(2)}</td>
                      <td>{p.count}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="ar-bar" style={{ width: 160 }}><i style={{ width: `${p.badRate}%` }} /></div>
                          <span className="ar-mono">{p.badRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Phân bổ số sao */}
          <div className="ar-card ar-panel" style={{ gridColumn: "span 5" }}>
            <div className="ar-panel-head">
              <h3>Phân bổ số sao</h3>
              <div className="ar-panel-right">Theo bộ lọc hiện tại</div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[5, 4, 3, 2, 1].map(k => {
                const idx = k - 1;
                const count = stats.dist[idx] || 0;
                const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="ar-mono" style={{ width: 58 }}>{k}★</div>
                    <div className="ar-bar" style={{ flex: 1 }}><i style={{ width: `${pct}%` }} /></div>
                    <div className="ar-mono" style={{ width: 80, textAlign: "right" }}>{count} • {pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="ar-card ar-panel">
          <div className="ar-panel-head">
            <h3>Bộ lọc</h3>
            <div className="ar-panel-right">Tip: search theo mã đơn / SKU / email / nội dung</div>
          </div>
          <div className="ar-filters">
            <div className="ar-field">
              <label><i className="fas fa-search" /> Tìm kiếm</label>
              <input className="ar-input" placeholder="ID, mã đơn, tên KH, email, SKU, nội dung…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
            </div>
            <div className="ar-field">
              <label><i className="far fa-calendar-alt" /> Từ ngày</label>
              <input className="ar-input" type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
            </div>
            <div className="ar-field">
              <label><i className="far fa-calendar-alt" /> Đến ngày</label>
              <input className="ar-input" type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
            </div>
            <div className="ar-field">
              <label><i className="fas fa-star" /> Sao min</label>
              <select className="ar-input" value={ratingMin} onChange={e => { setRatingMin(e.target.value ? Number(e.target.value) : ""); setPage(1); }}>
                <option value="">Tất cả</option>
                <option value="1">1★</option>
                <option value="2">2★</option>
                <option value="3">3★</option>
                <option value="4">4★</option>
                <option value="5">5★</option>
              </select>
            </div>
            <div className="ar-field">
              <label><i className="fas fa-star" /> Sao max</label>
              <select className="ar-input" value={ratingMax} onChange={e => { setRatingMax(e.target.value ? Number(e.target.value) : ""); setPage(1); }}>
                <option value="">Tất cả</option>
                <option value="1">1★</option>
                <option value="2">2★</option>
                <option value="3">3★</option>
                <option value="4">4★</option>
                <option value="5">5★</option>
              </select>
            </div>
            <div className="ar-field">
              <label><i className="fas fa-eye" /> Trạng thái</label>
              <select className="ar-input" value={visibility} onChange={e => { setVisibility(e.target.value as any); setSpamOnly(false); setAnonymousOnly(false); setPage(1); }}>
                <option value="all">Tất cả</option>
                <option value="visible">Đang hiển thị</option>
                <option value="hidden">Đang ẩn</option>
              </select>
            </div>
            <div className="ar-field">
              <label><i className="fas fa-image" /> Có ảnh</label>
              <select className="ar-input" value={hasImages} onChange={e => { setHasImages(e.target.value as any); setPage(1); }}>
                <option value="all">Tất cả</option>
                <option value="yes">Có ảnh</option>
                <option value="no">Không có ảnh</option>
              </select>
            </div>
            <div className="ar-field">
              <label><i className="fas fa-sort" /> Sắp xếp</label>
              <select className="ar-input" value={sortKey} onChange={e => { setSortKey(e.target.value as any); setPage(1); }}>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="lowestRating">Sao thấp nhất</option>
                <option value="highestRating">Sao cao nhất</option>
                <option value="mostHelpful">Hữu ích nhất</option>
              </select>
            </div>
            <div className="ar-field">
              <label>Tuỳ chọn</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label className="ar-chip" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={anonymousOnly} onChange={e => { setAnonymousOnly(e.target.checked); if (e.target.checked) { setSpamOnly(false); setVisibility("all"); } setPage(1); }} /> <i className="fas fa-user-secret" /> Ẩn danh
                </label>
                <label className="ar-chip" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={spamOnly} onChange={e => { setSpamOnly(e.target.checked); if (e.target.checked) { setAnonymousOnly(false); setVisibility("all"); } setPage(1); }} /> <i className="fas fa-ban" /> Spam
                </label>
              </div>
            </div>
            <div className="ar-field" />
          </div>
          <div className="ar-actions">
            <button className="ar-btn ghost" onClick={resetFilters}><i className="fas fa-undo-alt" /> Reset</button>
            <button className="ar-btn primary" onClick={() => toast("Đã áp dụng bộ lọc (demo).")}><i className="fas fa-check" /> Áp dụng</button>
          </div>
        </div>

        {/* Tabs gọn hơn + bulk actions */}
        <div className="ar-tabs">
          <div className="ar-tabs-left">
            <button className={`ar-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
              <i className="fas fa-list-ul" /> Tất cả <span className="ar-count">{tabCounts.all}</span>
            </button>
            <button className={`ar-tab ${activeTab === "visible" ? "active" : ""}`} onClick={() => setTab("visible")}>
              <i className="fas fa-eye" /> Hiển thị <span className="ar-count">{tabCounts.visible}</span>
            </button>
            <button className={`ar-tab ${activeTab === "hidden" ? "active" : ""}`} onClick={() => setTab("hidden")}>
              <i className="fas fa-eye-slash" /> Đã ẩn <span className="ar-count">{tabCounts.hidden}</span>
            </button>
            <button className={`ar-tab ${activeTab === "spam" ? "active" : ""}`} onClick={() => setTab("spam")}>
              <i className="fas fa-ban" /> Spam <span className="ar-count">{tabCounts.spam}</span>
            </button>
            <button className={`ar-tab ${activeTab === "anonymous" ? "active" : ""}`} onClick={() => setTab("anonymous")}>
              <i className="fas fa-user-secret" /> Ẩn danh <span className="ar-count">{tabCounts.anonymous}</span>
            </button>
          </div>
          <div className="ar-tabs-right">
            <span className="ar-mini-label"><i className="fas fa-table" /> Page size</span>
            <select className="ar-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10 / trang</option>
              <option value={15}>15 / trang</option>
              <option value={20}>20 / trang</option>
            </select>
            <span className="ar-mini-label"><i className="fas fa-tasks" /> Bulk</span>
            <button className="ar-btn" onClick={() => bulkAction("show")}><i className="fas fa-eye" /> Hiện</button>
            <button className="ar-btn" onClick={() => bulkAction("hide")}><i className="fas fa-eye-slash" /> Ẩn</button>
            <button className="ar-btn" onClick={() => bulkAction("spam")}><i className="fas fa-ban" /> Spam</button>
            <button className="ar-btn" onClick={() => bulkAction("unspam")}><i className="fas fa-check-circle" /> Bỏ spam</button>
            <button className="ar-btn danger" onClick={() => bulkAction("delete")}><i className="fas fa-trash-alt" /> Xóa</button>
          </div>
        </div>

        {/* Bảng dữ liệu đã tối ưu */}
        <div className="ar-card ar-table-wrap">
          <table className="ar-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={allOnPageChecked} onChange={e => setAllOnPage(e.target.checked)} /></th>
                <th>Ngày / Mã đơn</th>
                <th>Sản phẩm</th>
                <th>Đánh giá</th>
                <th>Ảnh</th>
                <th>Khách hàng</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 18, color: 'var(--muted)' }}>Không có dữ liệu phù hợp bộ lọc.</td></tr>
              ) : (
                pageRows.map(rv => (
                  <tr key={rv.id}>
                    <td><input type="checkbox" checked={!!selectedIds[rv.id]} onChange={e => setSelectedIds(p => ({ ...p, [rv.id]: e.target.checked }))} /></td>
                    <td>
                      <div><i className="far fa-calendar-alt" /> {fmtDate(rv.createdAt)} <span className="ar-mono">{rv.createdTime}</span></div>
                      <div className="ar-sub"><i className="fas fa-hashtag" /> {rv.purchase.orderCode}</div>
                    </td>
                    <td>
                      <div className="ar-product-info">
                        <img src={rv.entity.image} alt={rv.entity.name} />
                        <div>
                          <div className="ar-product-name">{rv.entity.name}</div>
                          <div className="ar-product-sku">{rv.entity.sku || 'Dịch vụ'} • {rv.entity.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ar-review-summary">
                        <div className="ar-stars">{stars(rv.rating)}</div>
                        <div className="ar-review-title">{rv.title}</div>
                        <div className="ar-review-excerpt">{rv.content.slice(0, 60)}…</div>
                        <div className="ar-helpful">
                          <span><i className="far fa-thumbs-up" /> {rv.helpfulUp}</span>
                          <span><i className="far fa-thumbs-down" /> {rv.helpfulDown}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {rv.images.length === 0 ? (
                        <span className="ar-sub">—</span>
                      ) : (
                        <div className="ar-thumbnails">
                          {rv.images.slice(0, 2).map(img => (
                            <img key={img.id} className="ar-thumb-sm" src={img.url} alt="" onClick={() => setLightboxUrl(img.url)} />
                          ))}
                          {rv.images.length > 2 && <span className="ar-badge">+{rv.images.length - 2}</span>}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="ar-customer-info">
                        <span className="ar-customer-name">{rv.isAnonymous ? 'Ẩn danh' : rv.customer.name}</span>
                        {!rv.isAnonymous && <span className="ar-customer-email">{rv.customer.email}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`ar-badge ${rv.flag === 'spam' ? 'spam' : rv.visibility}`}>
                        <i className={`fas ${rv.flag === 'spam' ? 'fa-ban' : rv.visibility === 'visible' ? 'fa-eye' : 'fa-eye-slash'}`} />
                        {rv.flag === 'spam' ? 'Spam' : rv.visibility === 'visible' ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="ar-table-actions">
                        <button className="ar-icon-btn" onClick={() => openDrawer(rv)} title="Xem chi tiết"><i className="fas fa-info-circle" /></button>
                        <button className="ar-icon-btn" onClick={() => toggleVisibility(rv.id)} title={rv.visibility === 'visible' ? 'Ẩn' : 'Hiện'}>
                          <i className={`fas ${rv.visibility === 'visible' ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                        <button className="ar-icon-btn" onClick={() => toggleSpamFlag(rv.id)} title={rv.flag === 'spam' ? 'Bỏ spam' : 'Gắn spam'}>
                          <i className={`fas ${rv.flag === 'spam' ? 'fa-check-circle' : 'fa-ban'}`} />
                        </button>
                        <button className="ar-icon-btn" onClick={() => deleteReview(rv.id)} title="Xóa"><i className="fas fa-trash-alt" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        <div className="ar-pager">
          <div className="ar-pager-left"><i className="fas fa-info-circle" /> {pagerInfo}</div>
          <div className="ar-pager-right">
            <button className="ar-page-btn" onClick={() => setPage(1)}><i className="fas fa-angle-double-left" /></button>
            <button className="ar-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))}><i className="fas fa-angle-left" /></button>
            <span className="ar-page-num">{page}</span>
            <button className="ar-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}><i className="fas fa-angle-right" /></button>
            <button className="ar-page-btn" onClick={() => setPage(totalPages)}><i className="fas fa-angle-double-right" /></button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div className={`ar-overlay ${drawerOpen || confirmOpen || !!lightboxUrl ? "show" : ""}`} onClick={() => { if (lightboxUrl) setLightboxUrl(null); else if (confirmOpen) setConfirmOpen(false); else if (drawerOpen) closeDrawer(); }} />

      {/* Lightbox */}
      <div className={`ar-lightbox ${lightboxUrl ? "show" : ""}`} onClick={() => setLightboxUrl(null)}>
        {lightboxUrl && <img src={lightboxUrl} alt="" />}
      </div>

      {/* Confirm Modal */}
      <div className={`ar-confirm ${confirmOpen ? "show" : ""}`} onClick={() => setConfirmOpen(false)}>
        <div className="ar-confirm-card" onClick={e => e.stopPropagation()}>
          <div className="ar-confirm-head">
            <h4><i className="fas fa-exclamation-triangle" /> {confirmTitle}</h4>
            <button className="ar-icon-btn" onClick={() => setConfirmOpen(false)}><i className="fas fa-times" /></button>
          </div>
          <p className="ar-confirm-desc">{confirmDesc}</p>
          <div className="ar-confirm-actions">
            <button className="ar-btn ghost" onClick={() => setConfirmOpen(false)}><i className="fas fa-times" /> Hủy</button>
            <button className="ar-btn danger" onClick={() => { const fn = confirmActionRef.current; setConfirmOpen(false); fn?.(); }}><i className="fas fa-check" /> Xác nhận</button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <div className={`ar-drawer ${drawerOpen ? "show" : ""}`} role="dialog" aria-modal="true">
        <div className="ar-drawer-head">
          <div className="ar-drawer-title">
            <h4><i className="fas fa-star" /> Chi tiết đánh giá • <span className="ar-mono">{selected?.id}</span></h4>
            <p><i className="far fa-calendar-alt" /> {selected ? `${fmtDate(selected.createdAt)} ${selected.createdTime}` : ''} • <i className="fas fa-hashtag" /> {selected?.purchase.orderCode}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {selected && (
              <span className={`ar-badge ${selected.flag === 'spam' ? 'spam' : selected.visibility}`}>
                <i className={`fas ${selected.flag === 'spam' ? 'fa-ban' : selected.visibility === 'visible' ? 'fa-eye' : 'fa-eye-slash'}`} />
                {selected.flag === 'spam' ? 'Spam' : selected.visibility === 'visible' ? 'Hiển thị' : 'Ẩn'}
              </span>
            )}
            <button className="ar-icon-btn" onClick={closeDrawer}><i className="fas fa-times" /></button>
          </div>
        </div>
        <div className="ar-drawer-body">
          {!selected ? (
            <div className="ar-section"><p className="ar-text">Chọn một đánh giá để xem chi tiết.</p></div>
          ) : (
            <>
              {/* Sản phẩm */}
              <div className="ar-section">
                <h5><i className="fas fa-box" /> Sản phẩm</h5>
                <div className="ar-entity">
                  <img src={selected.entity.image} alt={selected.entity.name} />
                  <div>
                    <div className="ar-entity-name">{selected.entity.name}</div>
                    <div className="ar-entity-meta">{selected.entity.sku || 'Dịch vụ'} • {selected.entity.category}</div>
                  </div>
                </div>
              </div>

              {/* Nội dung đánh giá */}
              <div className="ar-section">
                <h5><i className="fas fa-pencil-alt" /> Nội dung đánh giá</h5>
                <div className="ar-stars">{stars(selected.rating)}</div>
                <div className="ar-review-title">{selected.title}</div>
                <p className="ar-text">{selected.content}</p>
                <div className="ar-helpful">
                  <span><i className="far fa-thumbs-up" /> {selected.helpfulUp}</span>
                  <span><i className="far fa-thumbs-down" /> {selected.helpfulDown}</span>
                </div>
              </div>

              {/* Ảnh đính kèm */}
              <div className="ar-section">
                <h5><i className="fas fa-images" /> Ảnh đính kèm</h5>
                {selected.images.length === 0 ? (
                  <p className="ar-text">Không có ảnh.</p>
                ) : (
                  <div className="ar-thumbs">
                    {selected.images.map(img => (
                      <img key={img.id} src={img.url} alt="" onClick={() => setLightboxUrl(img.url)} />
                    ))}
                  </div>
                )}
              </div>

              {/* Thông tin khách hàng */}
              <div className="ar-section">
                <h5><i className="fas fa-user" /> Khách hàng (liên hệ nội bộ)</h5>
                <div className="ar-kv">
                  <div><div className="ar-k">Tên</div><div className="ar-v">{selected.isAnonymous ? 'Ẩn danh' : selected.customer.name}</div></div>
                  {!selected.isAnonymous && (
                    <>
                      <div><div className="ar-k">Email</div><div className="ar-v">{selected.customer.email} <button className="ar-btn" onClick={() => copyText(selected.customer.email)}><i className="fas fa-copy" /></button></div></div>
                      <div><div className="ar-k">SĐT</div><div className="ar-v">{selected.customer.phone} <button className="ar-btn" onClick={() => copyText(selected.customer.phone)}><i className="fas fa-copy" /></button></div></div>
                    </>
                  )}
                  <div><div className="ar-k">Khu vực</div><div className="ar-v">{selected.customer.city}</div></div>
                  <div><div className="ar-k">Tổng đơn</div><div className="ar-v">{selected.customer.totalOrders}</div></div>
                  <div><div className="ar-k">Đơn gần nhất</div><div className="ar-v">{selected.customer.lastOrderCode} • {fmtDate(selected.customer.lastOrderAt)}</div></div>
                </div>
              </div>

              {/* Thông tin mua hàng */}
              <div className="ar-section">
                <h5><i className="fas fa-shopping-cart" /> Thông tin mua hàng</h5>
                <div className="ar-kv">
                  <div><div className="ar-k">Mã đơn</div><div className="ar-v ar-mono">{selected.purchase.orderCode}</div></div>
                  <div><div className="ar-k">Ngày mua</div><div className="ar-v">{fmtDate(selected.purchase.purchasedAt)}</div></div>
                  <div><div className="ar-k">Chi nhánh</div><div className="ar-v">{selected.purchase.branch}</div></div>
                  <div><div className="ar-k">Thanh toán</div><div className="ar-v">{selected.purchase.paymentMethod}</div></div>
                </div>
              </div>

              {/* Ghi chú nội bộ */}
              <div className="ar-section">
                <h5><i className="fas fa-sticky-note" /> Ghi chú nội bộ</h5>
                <textarea className="ar-note" value={selected.staffNote} onChange={(e) => setSelected(prev => prev ? { ...prev, staffNote: e.target.value } : prev)} placeholder="Nhập ghi chú..." />
                <button className="ar-btn primary" onClick={() => updateStaffNote(selected.id, selected.staffNote)}><i className="fas fa-save" /> Lưu ghi chú</button>
              </div>

              {/* Lịch sử kiểm duyệt */}
              <div className="ar-section">
                <h5><i className="fas fa-history" /> Lịch sử kiểm duyệt</h5>
                {selected.logs.slice().reverse().map((lg, idx) => (
                  <div className="ar-log" key={idx}>
                    <div>
                      <div className="ar-log-action">{lg.action}</div>
                      <div className="ar-log-meta">{lg.at} • {lg.by}</div>
                      {lg.note && <div className="ar-sub">{lg.note}</div>}
                    </div>
                    <div className="ar-log-meta">
                      {lg.action === 'FLAG_SPAM' && <i className="fas fa-ban" />}
                      {lg.action === 'HIDE' && <i className="fas fa-eye-slash" />}
                      {lg.action === 'SHOW' && <i className="fas fa-eye" />}
                      {lg.action === 'DELETE' && <i className="fas fa-trash-alt" />}
                      {lg.action === 'NOTE_UPDATE' && <i className="fas fa-pen" />}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastMsg && <div className="ar-toast"><i className="fas fa-info-circle" /> {toastMsg}</div>}
    </div>
  );
}