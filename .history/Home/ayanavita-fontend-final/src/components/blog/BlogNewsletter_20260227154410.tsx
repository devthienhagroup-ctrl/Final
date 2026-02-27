import React, { useState } from "react";

export function BlogNewsletter() {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const sub = () => {
    const v = (email || "").trim();
    if (!v || !v.includes("@")) {
      setToast({ type: "err", msg: "Vui lòng nhập email hợp lệ." });
      return;
    }
    setToast({ type: "ok", msg: "Đã đăng ký (demo). Cảm ơn bạn!" });
    setEmail("");
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <section id="newsletter" className="bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="card p-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-extrabold text-slate-500">Newsletter</div>
              <div className="text-3xl font-extrabold mt-1">Nhận bản tin chăm sóc da & sống khỏe</div>
              <p className="mt-2 text-slate-600">
                Mỗi tuần 1 email: checklist skincare, lưu ý thành phần, thói quen sống khỏe (demo).
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <input
                  className="field flex-1"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn btn-accent" onClick={sub}>
                  <i className="fa-solid fa-paper-plane" /> Đăng ký
                </button>
              </div>

              {toast ? (
                <div
                  className={
                    "mt-3 rounded-2xl p-4 ring-1 text-sm " +
                    (toast.type === "ok"
                      ? "bg-emerald-50 ring-emerald-200 text-emerald-800"
                      : "bg-rose-50 ring-rose-200 text-rose-800")
                  }
                >
                  {toast.msg}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl overflow-hidden ring-1 ring-slate-200">
              <img
                alt="Newsletter"
                className="w-full h-64 object-cover"
                src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1600&q=80"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
