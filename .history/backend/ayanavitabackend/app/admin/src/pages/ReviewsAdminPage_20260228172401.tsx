import React, { useEffect, useMemo, useRef, useState } from "react";

// ==================== KIỂU DỮ LIỆU (giữ nguyên) ====================
type ReviewVisibility = "visible" | "hidden";
type ReviewFlag = "none" | "spam";
type Rating = 1 | 2 | 3 | 4 | 5;
type ReviewImage = { id: string; url: string };
type Customer = {
  id: string; name: string; email: string; phone: string; city: string;
  totalOrders: number; lastOrderCode: string; lastOrderAt: string; note?: string;
};
type ReviewedEntityType = "product" | "service";
type ReviewedEntity = {
  type: ReviewedEntityType; sku?: string; name: string; image: string; category: string;
};
type PurchaseInfo = {
  orderCode: string; purchasedAt: string; branch: string; paymentMethod: string;
};
type ModerationLog = {
  at: string; by: string;
  action: "CREATE" | "HIDE" | "SHOW" | "FLAG_SPAM" | "UNFLAG_SPAM" | "DELETE" | "NOTE_UPDATE";
  note?: string;
};
type Review = {
  id: string; createdAt: string; createdTime: string; verifiedPurchase: true; isAnonymous: boolean;
  entity: ReviewedEntity; rating: Rating; title: string; content: string;
  images: ReviewImage[]; customer: Customer; purchase: PurchaseInfo;
  visibility: ReviewVisibility; flag: ReviewFlag; helpfulUp: number; helpfulDown: number;
  staffNote: string; logs: ModerationLog[];
};

// ==================== DỮ LIỆU MẪU (giữ nguyên) ====================
const IMG = { serum: "...", sunscreen: "...", toner: "...", cream: "...", mask: "...", cleanser: "...", spaService: "..." };
const REVIEW_PHOTOS = ["...", "...", "...", "...", "...", "..."];
// ... các hàm seedReviews, pick, clamp, fmtDate, nowTimeLike, makeId, stars, toCSVCell giữ nguyên ...

// ==================== COMPONENT CHÍNH ====================
export function ReviewsAdminPage() {
  // ... tất cả state, logic, hàm xử lý giữ nguyên (không thay đổi) ...
  const [reviews, setReviews] = useState<Review[]>(seedReviews());
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Review | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const confirmActionRef = useRef<null | (() => void)>(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const scrollYRef = useRef(0);

  // ==================== THÊM FONTAWESOME ====================
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // ... các hàm filtered, stats, topBadProducts, pagerInfo, toast, openConfirm, v.v. giữ nguyên ...

  // ==================== RENDER ====================
  return (
    <div className="ar-reviews">
      {/* ===== CSS (đã điều chỉnh một số class cho phù hợp) ===== */}
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
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        }
        .ar-reviews * { box-sizing: border-box; }
        .ar-container { max-width: 1200px; margin: 0 auto; padding: 18px; padding-bottom: 36px; }

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

        /* ===== TABLE ĐÃ TỐI ƯU ===== */
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

        /* ===== ẢNH LỚN HƠN TRONG MODAL ===== */
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

        /* ... giữ nguyên các style khác ... */
      `}</style>

      {/* ===== HEADER VÀ CARD THỐNG KÊ (giữ nguyên nhưng thay icon) ===== */}
      <div className="ar-container">
        <div className="ar-page-title">
          <div>
            <h2>Quản lý đánh giá khách hàng</h2>
            <p className="ar-hint">Chỉ hiển thị review từ khách đã mua • Có ảnh • Ẩn danh</p>
          </div>
          <div className="ar-title-actions">
            <button className="ar-pill" onClick={fakeRefresh}><i className="fas fa-sync-alt" /> Làm mới</button>
            <button className="ar-pill" onClick={exportCSV}><i className="fas fa-download" /> Export CSV</button>
            <span className={`ar-loading ${loading ? "show" : ""}`}><span className="ar-spinner" /> Đang tải…</span>
          </div>
        </div>

        {/* ... 4 card thống kê, top sản phẩm tệ, phân bố sao giữ nguyên ... */}

        {/* ===== FILTERS (giữ nguyên) ===== */}

        {/* ===== TABS GỌN HƠN ===== */}
        <div className="ar-tabs">
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

          <div className="ar-tabs-right" style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="ar-mini-label"><i className="fas fa-table" /> Page size</span>
            <select className="ar-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
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

        {/* ===== BẢNG ĐÃ TỐI ƯU ===== */}
        <div className="ar-card ar-table-wrap">
          <table className="ar-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={allOnPageChecked} onChange={(e) => setAllOnPage(e.target.checked)} /></th>
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
                <tr><td colSpan={8} style={{ padding: 18, color: 'var(--muted)' }}>Không có dữ liệu</td></tr>
              ) : (
                pageRows.map(rv => (
                  <tr key={rv.id}>
                    <td><input type="checkbox" checked={!!selectedIds[rv.id]} onChange={(e) => setSelectedIds(p => ({ ...p, [rv.id]: e.target.checked }))} /></td>
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
                          {rv.images.length > 2 && <span className="ar-badge">+{rv.images.length-2}</span>}
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

        {/* ===== PAGER (giữ nguyên) ===== */}
        <div className="ar-pager">
          <div className="ar-pager-left"><i className="fas fa-info-circle" /> {pagerInfo}</div>
          <div className="ar-pager-right">
            <button className="ar-page-btn" onClick={() => setPage(1)}><i className="fas fa-angle-double-left" /></button>
            <button className="ar-page-btn" onClick={() => setPage(p => Math.max(1, p-1))}><i className="fas fa-angle-left" /></button>
            <span className="ar-page-num">{page}</span>
            <button className="ar-page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))}><i className="fas fa-angle-right" /></button>
            <button className="ar-page-btn" onClick={() => setPage(totalPages)}><i className="fas fa-angle-double-right" /></button>
          </div>
        </div>
      </div>

      {/* ===== MODAL, DRAWER, LIGHTBOX (giữ nguyên nhưng đã phóng to ảnh) ===== */}
      <div className={`ar-overlay ${drawerOpen || confirmOpen || !!lightboxUrl ? "show" : ""}`} onClick={() => { if (lightboxUrl) setLightboxUrl(null); else if (confirmOpen) setConfirmOpen(false); else if (drawerOpen) closeDrawer(); }} />
      <div className={`ar-lightbox ${lightboxUrl ? "show" : ""}`} onClick={() => setLightboxUrl(null)}>
        {lightboxUrl && <img src={lightboxUrl} alt="" />}
      </div>
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
              {/* phần tổng quan, khách hàng, mua hàng, ghi chú, audit log giữ nguyên nội dung, chỉ thay icon */}
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
              <div className="ar-section">
                <h5><i className="fas fa-shopping-cart" /> Thông tin mua hàng</h5>
                <div className="ar-kv">
                  <div><div className="ar-k">Mã đơn</div><div className="ar-v ar-mono">{selected.purchase.orderCode}</div></div>
                  <div><div className="ar-k">Ngày mua</div><div className="ar-v">{fmtDate(selected.purchase.purchasedAt)}</div></div>
                  <div><div className="ar-k">Chi nhánh</div><div className="ar-v">{selected.purchase.branch}</div></div>
                  <div><div className="ar-k">Thanh toán</div><div className="ar-v">{selected.purchase.paymentMethod}</div></div>
                </div>
              </div>
              <div className="ar-section">
                <h5><i className="fas fa-sticky-note" /> Ghi chú nội bộ</h5>
                <textarea className="ar-note" value={selected.staffNote} onChange={(e) => setSelected(prev => prev ? { ...prev, staffNote: e.target.value } : prev)} placeholder="Nhập ghi chú..." />
                <button className="ar-btn primary" onClick={() => updateStaffNote(selected.id, selected.staffNote)}><i className="fas fa-save" /> Lưu ghi chú</button>
              </div>
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
      {toastMsg && <div className="ar-toast"><i className="fas fa-info-circle" /> {toastMsg}</div>}
    </div>
  );
}