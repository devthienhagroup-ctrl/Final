import React, { useMemo, useState } from "react";

export type BlogNewsletterCmsData = {
  // chỉ nội dung, không màu/kích thước/layout
  badge?: string; // "Newsletter"
  title?: string; // "Nhận bản tin..."
  description?: string; // đoạn mô tả
  emailPlaceholder?: string; // placeholder input
  buttonText?: string; // text nút
  buttonIconClass?: string; // class FontAwesome, ví dụ: "fa-solid fa-paper-plane"

  toastInvalidEmail?: string; // khi email sai
  toastSubscribed?: string; // khi đăng ký ok

  imageAlt?: string;
  imageSrc?: string;
};

const DEFAULT_CMS_DATA: Required<BlogNewsletterCmsData> = {
  badge: "Newsletter",
  title: "Nhận bản tin chăm sóc da & sống khỏe",
  description: "Mỗi tuần 1 email: checklist skincare, lưu ý thành phần, thói quen sống khỏe (demo).",
  emailPlaceholder: "email@domain.com",
  buttonText: "Đăng ký",
  buttonIconClass: "fa-solid fa-paper-plane",
  toastInvalidEmail: "Vui lòng nhập email hợp lệ.",
  toastSubscribed: "Đã đăng ký (demo). Cảm ơn bạn!",
  imageAlt: "Newsletter",
  imageSrc:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1600&q=80",
};

type Props = {
  cmsData?: BlogNewsletterCmsData;
};

export function BlogNewsletter({ cmsData }: Props) {
  const data = useMemo(
      () => ({ ...DEFAULT_CMS_DATA, ...(cmsData || {}) }),
      [cmsData]
  );

  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const sub = () => {
    const v = (email || "").trim();
    if (!v || !v.includes("@")) {
      setToast({ type: "err", msg: data.toastInvalidEmail });
      return;
    }
    setToast({ type: "ok", msg: data.toastSubscribed });
    setEmail("");
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
      <section id="newsletter" className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="card p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-xs font-extrabold text-slate-500">{data.badge}</div>
                <div className="text-3xl font-extrabold mt-1">{data.title}</div>
                <p className="mt-2 text-slate-600">{data.description}</p>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <input
                      className="field flex-1"
                      placeholder={data.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                  />
                  <button className="btn btn-accent" onClick={sub}>
                    {data.buttonIconClass ? <i className={data.buttonIconClass} /> : null}{" "}
                    {data.buttonText}
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
                    alt={data.imageAlt}
                    className="w-full h-64 object-cover"
                    src={data.imageSrc}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}