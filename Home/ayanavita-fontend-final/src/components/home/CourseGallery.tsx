// src/components/home/CourseGallery.tsx
import React from "react";

type CourseCard = {
  level: string;
  rating: string;
  title: string;
  desc: string;
  meta: string;
  price: string;
  imageUrl: string;
  href?: string;
};

// Dữ liệu CMS chỉ chứa nội dung thuần (không có style, kích thước...)
type CourseGalleryCMS = {
  heading?: string;           // tiêu đề chính
  subheading?: string;        // mô tả phụ
  buttonText?: string;        // chữ trên nút ưu đãi
  buttonIcon?: string;        // class icon (ví dụ "fa-solid fa-ticket")
};

type CourseGalleryProps = {
  onGetDeal?: () => void;
  cmsData?: CourseGalleryCMS; // dữ liệu từ CMS
};

export const CourseGallery: React.FC<CourseGalleryProps> = ({
                                                              onGetDeal,
                                                              cmsData,
                                                            }) => {
  // courses sẽ được lấy từ DB, không nằm trong cmsData
  const courses: CourseCard[] = [
    {
      level: "Beginner",
      rating: "4.8 (1.2k)",
      title: "React + UI Systems cho LMS",
      desc: "Từ HTML prototype → React component hóa.",
      meta: "12 giờ • 45 bài",
      price: "399.000đ",
      imageUrl:
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=80",
      href: "#register",
    },
    {
      level: "Intermediate",
      rating: "4.7 (860)",
      title: "NestJS + Prisma (LMS API)",
      desc: "Auth, courses, orders, progress, roles.",
      meta: "16 giờ • 62 bài",
      price: "599.000đ",
      imageUrl:
          "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1400&q=80",
      href: "#register",
    },
    {
      level: "Advanced",
      rating: "4.9 (2.1k)",
      title: "Flutter LMS App",
      desc: "Player, offline cache, đồng bộ tiến độ.",
      meta: "20 giờ • 80 bài",
      price: "799.000đ",
      imageUrl:
          "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=80",
      href: "#register",
    },
  ];

  // Giá trị mặc định nếu cmsData không được cung cấp
  const {
    heading = "Khóa học nổi bật",
    subheading = "Card rõ ràng để landing “đã mắt” và tăng chuyển đổi.",
    buttonText = "Nhận ưu đãi",
    buttonIcon = "fa-solid fa-ticket",
  } = cmsData ?? {};

  return (
      <section id="courseGallery" className="w-full py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
              <p className="mt-2 text-slate-600">{subheading}</p>
            </div>

            <button
                type="button"
                onClick={onGetDeal}
                className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:opacity-95 md:inline-flex"
            >
              <i className={buttonIcon}></i> {buttonText}
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {courses.map((c) => (
                <a
                    key={c.title}
                    href={c.href ?? "#register"}
                    className="group overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 hover:shadow transition"
                >
                  <img className="h-44 w-full object-cover" src={c.imageUrl} alt={c.title} />
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {c.level}
                  </span>
                      <span className="text-xs text-slate-500">⭐ {c.rating}</span>
                    </div>

                    <h3 className="mt-3 font-semibold text-slate-900 group-hover:underline">{c.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{c.desc}</p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-slate-600">{c.meta}</span>
                      <span className="font-semibold text-slate-900">{c.price}</span>
                    </div>
                  </div>
                </a>
            ))}
          </div>
        </div>
      </section>
  );
};