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



const LUX_BG =
  "relative overflow-hidden bg-slate-950 text-white " +
  "before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(11,18,32,.92),rgba(17,24,39,.84),rgba(11,18,32,.65))] before:content-['']";

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold " + className}>
      {children}
    </span>
  );
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

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
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
    if (!confirm("Xoá toàn bộ dữ liệu review demo + localStorage?")) return;
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
    setFName("Lê Hữu (Demo)");
    setFCat("service");
    setFItem("Body Detox 60 phút");
    setFBranch("Q.1");
    setPickedStars(5);
    setFText("Không gian rất sạch, kỹ thuật viên làm đều tay, cảm giác thư giãn. Hỗ trợ đặt lịch nhanh. Đề xuất thêm gói membership.");
    setFVerified(true);
    setFAnonymous(false);
  }

  function submitReview() {
    const name = fName.trim();
    const item = fItem.trim();
    const text = fText.trim();
    if (!name || !item || !text) {
      alert("Vui lòng nhập Họ tên, Tên mục và Nội dung.");
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
      {/* Top Strip */}
      <div className="bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] text-white">
        <Container className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-sm font-extrabold">AYANAVITA • Reviews Center</div>
          <div className="text-sm text-white/90">
            Hotline: <b>090x xxx xxx</b> • CSKH: <b>support@ayanavita.vn</b>
          </div>
        </Container>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Container className="py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-500/25">
              A
            </div>
            <div>
              <div className="text-lg font-extrabold leading-tight">AYANAVITA</div>
              <div className="text-xs font-extrabold text-slate-500">Đánh giá dịch vụ & sản phẩm</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Button tone="brand" variant="solid" onClick={openWrite}>
              Viết đánh giá
            </Button>
            <Button variant="ghost" onClick={() => setDrawerOpen(true)}>
              Đã lưu
            </Button>
          </div>

          <div className="lg:hidden flex gap-2">
            <Button tone="brand" variant="solid" onClick={openWrite}>
              Viết
            </Button>
            <Button variant="ghost" onClick={() => setDrawerOpen(true)}>
              Lưu
            </Button>
          </div>
        </Container>
      </div>

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
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <Chip className="bg-white/10 border-white/15 text-white">Verified Reviews</Chip>
                <Chip className="bg-white/10 border-white/15 text-white">CSKH hỗ trợ</Chip>
                <Chip className="bg-white/10 border-white/15 text-white">Ưu đãi theo hạng</Chip>
              </div>

              <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold leading-tight">
                Khách hàng nói gì về <span className="text-amber-300">AYANAVITA</span>
              </h1>

              <p className="mt-4 text-white/90 text-lg leading-relaxed">
                Xem đánh giá thực tế về <b>dịch vụ</b>, <b>sản phẩm</b> và trải nghiệm tại cơ sở. Bạn cũng có thể viết đánh giá để nhận
                voucher (demo).
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button tone="accent" variant="solid" onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}>
                  Xem danh sách
                </Button>
                <Button tone="brand" variant="solid" onClick={openWrite}>
                  Viết đánh giá ngay
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-white/10 border-white/15 text-white">
                  <div className="p-4">
                    <div className="text-xs font-extrabold text-white/70">Điểm TB</div>
                    <div className="text-2xl font-extrabold">{stats.avg ? stats.avg.toFixed(1) : "—"}</div>
                    <div className="text-xs text-white/70 mt-1">/ 5</div>
                  </div>
                </Card>
                <Card className="bg-white/10 border-white/15 text-white">
                  <div className="p-4">
                    <div className="text-xs font-extrabold text-white/70">Tổng đánh giá</div>
                    <div className="text-2xl font-extrabold">{stats.count || "—"}</div>
                    <div className="text-xs text-white/70 mt-1">bài</div>
                  </div>
                </Card>
                <Card className="bg-white/10 border-white/15 text-white">
                  <div className="p-4">
                    <div className="text-xs font-extrabold text-white/70">Đã xác thực</div>
                    <div className="text-2xl font-extrabold">{stats.verified || "—"}</div>
                    <div className="text-xs text-white/70 mt-1">bài</div>
                  </div>
                </Card>
                <Card className="bg-white/10 border-white/15 text-white">
                  <div className="p-4">
                    <div className="text-xs font-extrabold text-white/70">Hữu ích</div>
                    <div className="text-2xl font-extrabold">{stats.helpful || "—"}</div>
                    <div className="text-xs text-white/70 mt-1">lượt</div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Summary Card */}
            <Card className="p-6" id="summary">
              <div className="flex items-center justify-between">
                <div>
                  <SubTitle>Tổng quan</SubTitle>
                  <div className="text-xl font-extrabold">Xếp hạng & phân bố sao</div>
                </div>
                <Badge tone="brand">Live</Badge>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4 items-start">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-extrabold">{stats.avg ? stats.avg.toFixed(1) : "—"}</div>
                    <div className="flex-1">
                      <StarsRow value={avgStars} size="lg" />
                      <div className="text-sm text-slate-600 mt-1">
                        Dựa trên <b>{stats.count || "—"}</b> đánh giá.
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button tone="brand" variant="solid" className="w-full" onClick={openWrite}>
                      Viết đánh giá
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-sm font-extrabold text-slate-800">Phân bố theo sao</div>

                  <div className="mt-3 grid gap-2">
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

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setFilters((p) => ({ ...p, verifiedOnly: true }))}
                    >
                      Chỉ xác thực
                    </Button>
                    <Button variant="ghost" onClick={resetFilters}>
                      Reset
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                Prototype: Khi có backend, bạn lưu review theo “serviceId/productId”, trạng thái “verified”, và moderation.
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* LIST + FILTERS */}
      <section id="reviews">
        <Container className="py-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <SubTitle>Danh sách</SubTitle>
              <Title className="mt-1">Đánh giá mới nhất</Title>
              <p className="mt-2 text-slate-600">Lọc theo sao, dịch vụ/sản phẩm, từ khóa. Like “Hữu ích” để ưu tiên hiển thị.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button tone="brand" variant="solid" onClick={openWrite}>
                Viết đánh giá
              </Button>
              <Button variant="ghost" onClick={clearDemo}>
                Xoá demo
              </Button>
            </div>
          </div>

          <Card className="mt-6 p-6">
            <div className="grid lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-4">
                <div className="text-sm font-extrabold text-slate-700">Tìm kiếm</div>
                <div className="mt-2">
                  <Input value={filters.q} onChange={(v) => setFilters((p) => ({ ...p, q: v }))} placeholder="VD: facial, massage, serum..." />
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="text-sm font-extrabold text-slate-700">Danh mục</div>
                <div className="mt-2">
                  <Select value={filters.category} onChange={(v) => setFilters((p) => ({ ...p, category: v as any }))}>
                    <option value="all">Tất cả</option>
                    <option value="service">Dịch vụ</option>
                    <option value="product">Sản phẩm</option>
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="text-sm font-extrabold text-slate-700">Sắp xếp</div>
                <div className="mt-2">
                  <Select value={filters.sort} onChange={(v) => setFilters((p) => ({ ...p, sort: v as any }))}>
                    <option value="new">Mới nhất</option>
                    <option value="helpful">Hữu ích nhất</option>
                    <option value="high">Sao cao → thấp</option>
                    <option value="low">Sao thấp → cao</option>
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-2 flex gap-2">
                <Button tone="brand" variant="solid" className="flex-1" onClick={() => { /* state already live */ }}>
                  Lọc
                </Button>
                <Button variant="ghost" className="flex-1" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["all", "5", "4", "3", "2", "1"] as const).map((s) => (
                <button
                  key={s}
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold " +
                    (filters.star === s ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50")
                  }
                  onClick={() => setFilters((p) => ({ ...p, star: s }))}
                  type="button"
                >
                  {s === "all" ? "Tất cả" : `${s} sao`}
                </button>
              ))}

              <button
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold " +
                  (filters.verifiedOnly ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50")
                }
                onClick={() => setFilters((p) => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
                type="button"
              >
                Verified: {filters.verifiedOnly ? "ON" : "OFF"}
              </button>
            </div>
          </Card>

          {/* Grid */}
          {filtered.length === 0 ? (
            <Card className="mt-10 p-8 text-center">
              <div className="text-xl font-extrabold">Chưa có đánh giá phù hợp</div>
              <div className="mt-2 text-slate-600">Thử thay đổi bộ lọc hoặc viết đánh giá mới.</div>
              <Button tone="brand" variant="solid" className="mt-4" onClick={resetFilters}>
                Reset bộ lọc
              </Button>
            </Card>
          ) : (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {filtered.map((r) => {
                const displayName = r.anonymous ? "Ẩn danh" : r.name || "Khách hàng";
                const savedOn = savedSet.has(r.id);
                const voted = !!voteMap[r.id];

                return (
                  <Card key={r.id} className="overflow-hidden">
                    <div className="relative">
                      <img src={r.img} alt={r.item} className="w-full h-44 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 to-transparent" />
                      <div className="absolute left-4 bottom-4 flex flex-wrap gap-2">
                        <Badge tone={r.category === "service" ? "brand" : "accent"}>{r.category === "service" ? "Dịch vụ" : "Sản phẩm"}</Badge>
                        {r.verified && <Badge tone="success">Đã xác thực</Badge>}
                        <Badge tone="accent">{r.rating}.0</Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-extrabold">{r.item}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            <b>{displayName}</b> {r.branch ? `• ${r.branch}` : ""} • <Muted>{formatDateVi(r.createdAt)}</Muted>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          title="Lưu"
                          className={savedOn ? "border-indigo-200 bg-indigo-50 text-indigo-700" : ""}
                          onClick={() => toggleSave(r.id)}
                        >
                          {savedOn ? "Đã lưu" : "Lưu"}
                        </Button>
                      </div>

                      <div className="mt-3">
                        <StarsRow value={r.rating} />
                      </div>

                      <p className="mt-3 text-slate-700 leading-relaxed whitespace-pre-line">{r.text}</p>

                      {r.reply && (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <div className="text-sm font-extrabold text-slate-800">AYANAVITA phản hồi</div>
                          <div className="text-sm text-slate-700 mt-2 whitespace-pre-line">{r.reply.text}</div>
                        </div>
                      )}

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <Button
                          tone={voted ? "brand" : "muted"}
                          variant={voted ? "solid" : "ghost"}
                          onClick={() => toggleHelpful(r.id)}
                        >
                          Hữu ích ({r.helpful || 0})
                        </Button>
                        <Button variant="ghost" onClick={() => alert(`Đã gửi báo cáo (demo). ReviewID: ${r.id}`)}>
                          Báo cáo
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
          <SubTitle>FAQ</SubTitle>
          <Title className="mt-1">Câu hỏi thường gặp</Title>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {[
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
            ].map((x) => (
              <Card key={x.q} className="p-6">
                <div className="font-extrabold">{x.q}</div>
                <div className="mt-2 text-slate-600 text-sm">{x.a}</div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <Container className="py-12 grid md:grid-cols-4 gap-6">
          <div>
            <div className="text-white font-extrabold">AYANAVITA</div>
            <p className="text-sm mt-2 text-slate-400">Luxury Spa – Products – Training. Lắng nghe phản hồi để nâng cấp chất lượng.</p>
          </div>

          <div>
            <div className="text-white font-extrabold">Reviews</div>
            <div className="mt-3 text-sm space-y-2 text-slate-400">
              <button className="hover:text-white text-left" onClick={() => document.getElementById("summary")?.scrollIntoView({ behavior: "smooth" })}>
                Tổng quan
              </button>
              <button className="hover:text-white text-left" onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}>
                Danh sách
              </button>
              <button className="hover:text-white text-left" onClick={openWrite}>
                Viết đánh giá
              </button>
            </div>
          </div>

          <div>
            <div className="text-white font-extrabold">Dịch vụ</div>
            <div className="mt-3 text-sm space-y-2 text-slate-400">
              <div>Chăm sóc da</div>
              <div>Massage trị liệu</div>
              <div>Body detox</div>
              <div>Sản phẩm spa</div>
            </div>
          </div>

          <div>
            <div className="text-white font-extrabold">Liên hệ</div>
            <div className="mt-3 text-sm space-y-2 text-slate-400">
              <div>090x xxx xxx</div>
              <div>support@ayanavita.vn</div>
              <div>Việt Nam</div>
            </div>
            <div className="mt-4">
              <Button tone="accent" variant="solid" className="w-full" onClick={() => setDrawerOpen(true)}>
                Xem đã lưu
              </Button>
            </div>
          </div>
        </Container>

        <div className="text-center text-xs text-slate-500 pb-8">© 2025 AYANAVITA • Reviews Prototype (React)</div>
      </footer>

      {/* Sticky CTA mobile */}
      <div className="fixed left-0 right-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-slate-200 p-3 md:hidden">
        <Container className="px-2 flex items-center gap-2">
          <Button tone="brand" variant="solid" className="flex-1" onClick={openWrite}>
            Viết đánh giá
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => setDrawerOpen(true)}>
            Đã lưu
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
                <SubTitle>Saved</SubTitle>
                <div className="text-lg font-extrabold">Đánh giá đã lưu</div>
              </div>
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                Đóng
              </Button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                Prototype: lưu danh sách “saved reviews” bằng localStorage để người dùng xem lại.
              </div>

              <Hr className="mt-5" />

              <div className="mt-5 flex items-center justify-between">
                <div className="font-extrabold">Danh sách</div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSavedIds([]);
                    saveSavedIds([]);
                  }}
                >
                  Xoá
                </Button>
              </div>

              {savedIds.length === 0 ? (
                <div className="mt-10 text-center text-slate-600">
                  <div className="mt-2 font-extrabold">Chưa có mục đã lưu</div>
                  <div className="text-sm mt-1">Nhấn “Lưu” ở một review để thấy nó xuất hiện tại đây.</div>
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
                              {(r!.anonymous ? "Ẩn danh" : r!.name) + " • " + r!.rating + "★"}
                            </div>
                          </div>
                          <Button variant="ghost" onClick={() => toggleSave(r!.id)}>
                            Bỏ lưu
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
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <SubTitle>Write</SubTitle>
                  <div className="text-lg font-extrabold">Viết đánh giá</div>
                </div>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Đóng
                </Button>
              </div>

              <div className="p-6 grid gap-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Họ và tên</div>
                    <div className="mt-2">
                      <Input value={fName} onChange={setFName} placeholder="Nguyễn Văn A" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Danh mục</div>
                    <div className="mt-2">
                      <Select value={fCat} onChange={(v) => setFCat(v as any)}>
                        <option value="service">Dịch vụ</option>
                        <option value="product">Sản phẩm</option>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Tên dịch vụ/sản phẩm</div>
                    <div className="mt-2">
                      <Input value={fItem} onChange={setFItem} placeholder="VD: Facial Luxury, Serum AYA..." />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Chi nhánh (tuỳ chọn)</div>
                    <div className="mt-2">
                      <Input value={fBranch} onChange={setFBranch} placeholder="VD: Q.1 / Hà Nội..." />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-sm font-extrabold text-slate-700">Chấm sao</div>
                  <StarPicker value={pickedStars} onChange={setPickedStars} />
                  <div className="text-sm text-slate-600 mt-1">Chọn 1–5 sao.</div>
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-700">Nội dung đánh giá</div>
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-400"
                    rows={4}
                    value={fText}
                    onChange={(e) => setFText(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-3 items-start">
                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Ảnh minh hoạ (demo)</div>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      onChange={(e) => onFileChange(e.target.files?.[0])}
                    />
                    <div className="text-xs text-slate-500 mt-2">Ảnh chỉ preview trong trình duyệt, không upload server.</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-extrabold">Preview ảnh</div>
                    <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                      <img alt="preview" className="w-full h-40 object-cover" src={imgPreview} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold">
                    <input type="checkbox" checked={fVerified} onChange={(e) => setFVerified(e.target.checked)} />
                    Đã xác thực (demo)
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold">
                    <input type="checkbox" checked={fAnonymous} onChange={(e) => setFAnonymous(e.target.checked)} />
                    Ẩn danh
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button tone="accent" variant="solid" className="flex-1" onClick={demoFill}>
                    Demo
                  </Button>
                  <Button tone="brand" variant="solid" className="flex-1" onClick={submitReview}>
                    Gửi
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
