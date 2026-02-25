// src/components/home/ProductSection.tsx
import React from "react";

interface ProductItem {
  icon: string;
  title: string;
  desc: string;
  tone: string;
}

interface ProductSectionProps {
  cmsData?: {
    badge?: string;
    title?: string;
    description?: string;
    items?: ProductItem[];
    marketingBox?: {
      label: string;
      title: string;
      desc: string;
    };
    salesBox?: {
      label: string;
      title: string;
      desc: string;
    };
    imageUrl?: string;
    imageAlt?: string;
  };
}

export const ProductSection: React.FC<ProductSectionProps> = ({ cmsData }) => {
  // Default content
  const defaultItems: ProductItem[] = [
    { icon: 'fa-solid fa-magnifying-glass', title: "Catalog & Search", desc: "Danh sách khóa học, tìm kiếm, lọc, phân loại, sắp xếp.", tone: "indigo" },
    { icon: "fa-solid fa-bolt-lightning text-amber-900", title: "Course Detail chuyển đổi cao", desc: "Outline chương/bài, review, lợi ích, CTA mua rõ ràng.", tone: "amber" },
    { icon: "fa-solid fa-circle-play text-cyan-900", title: "Lesson Player & Progress", desc: "Video player + danh sách bài + tiến độ + tiếp tục bài.", tone: "cyan" },
    { icon: "fa-solid fa-shield-halved text-emerald-900", title: "Instructor + Admin", desc: "Quản lý nội dung, học viên, đơn hàng, báo cáo, phân quyền.", tone: "emerald" },
  ];

  const defaultData = {
    badge: "AYANAVITA cung cấp gì?",
    title: "AYANAVITA cung cấp gì?",
    description: "Bộ UI/UX chuẩn cho LMS bán khóa học. Làm HTML prototype để chốt layout → chuyển React → nối NestJS/Prisma/MySQL.",
    items: defaultItems,
    marketingBox: {
      label: "Marketing",
      title: "Landing nội dung dài",
      desc: "Giữ người đọc, tăng trust, tăng tỷ lệ mua."
    },
    salesBox: {
      label: "Sales",
      title: "Checkout đơn giản",
      desc: "Giảm bỏ giỏ, CTA rõ, ít bước."
    },
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Team"
  };

  // Merge cmsData with defaults
  const data = {
    ...defaultData,
    ...cmsData,
    items: cmsData?.items || defaultData.items,
    marketingBox: {
      ...defaultData.marketingBox,
      ...cmsData?.marketingBox
    },
    salesBox: {
      ...defaultData.salesBox,
      ...cmsData?.salesBox
    }
  };

  const toneBox: Record<string, string> = {
    indigo: "bg-indigo-100",
    amber: "bg-amber-100",
    cyan: "bg-cyan-100",
    emerald: "bg-emerald-100",
  };

  return (
      <section id="product" className="w-full py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              {data.badge && (
                  <span className="text-sm font-semibold text-indigo-600 mb-2 block">{data.badge}</span>
              )}
              <h2 className="text-3xl font-extrabold text-slate-900">{data.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{data.description}</p>

              <div className="mt-6 grid gap-3">
                {data.items.map((x) => (
                    <div key={x.title} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 shadow-sm hover:shadow transition">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${toneBox[x.tone]}`}>
                          <span className="text-lg"><i className={x.icon}></i></span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{x.title}</div>
                          <div className="mt-1 text-sm text-slate-600">{x.desc}</div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
              <img
                  className="h-72 w-full rounded-2xl object-cover"
                  src={data.imageUrl}
                  alt={data.imageAlt}
              />

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{data.marketingBox.label}</div>
                  <div className="mt-1 font-semibold text-slate-900">{data.marketingBox.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{data.marketingBox.desc}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{data.salesBox.label}</div>
                  <div className="mt-1 font-semibold text-slate-900">{data.salesBox.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{data.salesBox.desc}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};