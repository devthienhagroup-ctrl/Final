// src/components/home/Reviews.tsx
import React from "react";

// Định nghĩa interface cho dữ liệu CMS
interface ReviewItem {
  title: string;
  rating: string;
  text: string;
  name: string;
  role: string;
  avatar: string;
}

interface ReviewsCMSData {
  badge: string;
  badgeDetail: string;
  reviews: ReviewItem[];
}

interface ReviewsProps {
  cmsData?: ReviewsCMSData;
}

export const Reviews: React.FC<ReviewsProps> = ({ cmsData }) => {
  // Dữ liệu mặc định
  const defaultData: ReviewsCMSData = {
    badge: "4.8/5",
    badgeDetail: "Từ 2.4k đánh giá",
    reviews: [
      {
        title: "“UI rất rõ ràng”",
        rating: "5.0",
        text: "Landing và course detail đúng kiểu thương mại, CTA rõ, nhìn chuyên nghiệp.",
        name: "Minh Anh",
        role: "Học viên • Beginner",
        avatar:
            "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
      },
      {
        title: "“Chuyển React rất nhanh”",
        rating: "4.9",
        text: "Làm HTML trước giúp team thống nhất. Tách component xong map data từ API.",
        name: "Tuấn Kiệt",
        role: "Developer",
        avatar:
            "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=300&q=80",
      },
      {
        title: "“Player học thích”",
        rating: "4.8",
        text: "Player + progress dễ dùng, có tiếp tục bài học, phù hợp làm mobile app.",
        name: "Hoài Phương",
        role: "Marketing",
        avatar:
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
      },
    ],
  };

  // Sử dụng cmsData nếu có, nếu không thì dùng defaultData
  const data = cmsData || defaultData;

  return (
      <section id="reviews" className="w-full pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Đánh giá từ học viên</h2>
              <p className="mt-2 text-slate-600">Tăng độ tin cậy bằng review chi tiết + điểm rating.</p>
            </div>

            <div className="hidden rounded-3xl bg-white px-5 py-3 ring-1 ring-slate-200 shadow-sm md:block">
              <div className="text-sm font-semibold">{data.badge}</div>
              <div className="text-xs text-slate-600">{data.badgeDetail}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {data.reviews.map((r, index) => (
                <div key={index} className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                    <div className="text-xs text-slate-500">⭐ {r.rating}</div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-700">{r.text}</p>

                  <div className="mt-4 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover" src={r.avatar} alt={r.name} />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.role}</div>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </section>
  );
};