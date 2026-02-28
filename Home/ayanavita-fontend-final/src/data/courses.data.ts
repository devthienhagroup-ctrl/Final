// src/data/courses.data.ts
export type CourseTopic = "technique" | "consult" | "ops" | "product";
export type CourseSort = "best" | "new" | "high" | "low";

export type Course = {
  id: string;
  title: string;
  topic: CourseTopic;
  topicName?: string;
  topicId?: number | null;
  img: string;
  desc: string;
  time?: string;
  price: number;
  hours: number;
  rating: number;
  students: number;
  popular: number; // điểm phổ biến demo
  date: string; // YYYY-MM-DD
};

export const TOPIC_LABEL: Record<CourseTopic, string> = {
  technique: "Kỹ thuật",
  consult: "Tư vấn",
  ops: "Vận hành",
  product: "Sản phẩm",
};

export function topicLabel(t: string) {
  return (TOPIC_LABEL as any)[t] || "Khác";
}

export const COURSES: Course[] = [
  {
    id: "C-101",
    title: "Kỹ thuật Facial Luxury – chuẩn liệu trình 90 phút",
    topic: "technique",
    img: "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1800&q=80",
    desc: "Quy trình facial chuẩn: làm sạch, tẩy da chết, massage, mask, serum. Đánh giá da và tư vấn sau liệu trình.",
    price: 1290000,
    hours: 6,
    rating: 4.9,
    students: 3120,
    popular: 98,
    date: "2025-11-28",
  },
  {
    id: "C-102",
    title: "Massage trị liệu vai gáy – giảm đau mỏi cho dân văn phòng",
    topic: "technique",
    img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1800&q=80",
    desc: "Định vị điểm căng cơ, kỹ thuật day ấn đúng lực, hướng dẫn chăm sóc tại nhà và lưu ý chống chỉ định.",
    price: 990000,
    hours: 5,
    rating: 4.7,
    students: 2150,
    popular: 91,
    date: "2025-11-12",
  },
  {
    id: "C-201",
    title: "Tư vấn liệu trình & bán chéo sản phẩm (Upsell/CRM)",
    topic: "consult",
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=80",
    desc: "Kịch bản tư vấn: hỏi đúng – chẩn đoán – đề xuất giải pháp. Kỹ thuật bán chéo theo nhu cầu và tăng tỷ lệ quay lại.",
    price: 790000,
    hours: 4,
    rating: 4.8,
    students: 1680,
    popular: 87,
    date: "2025-10-25",
  },
  {
    id: "C-301",
    title: "Vận hành spa: SOP, KPI, QA – chuẩn nhượng quyền",
    topic: "ops",
    img: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1800&q=80",
    desc: "Xây SOP từng điểm chạm, theo dõi KPI, kiểm soát chất lượng dịch vụ và trải nghiệm khách hàng theo chuẩn chuỗi.",
    price: 1590000,
    hours: 8,
    rating: 4.9,
    students: 980,
    popular: 95,
    date: "2025-10-10",
  },
  {
    id: "C-401",
    title: "Kiến thức sản phẩm: thành phần – cách phối routine an toàn",
    topic: "product",
    img: "https://images.unsplash.com/photo-1611930022143-6c05b86de1c1?auto=format&fit=crop&w=1800&q=80",
    desc: "Niacinamide, ceramide, retinol, AHA/BHA… hiểu cơ chế và phối routine cho từng loại da, tránh kích ứng.",
    price: 690000,
    hours: 5,
    rating: 4.6,
    students: 1340,
    popular: 83,
    date: "2025-09-22",
  },
];

export function filterSortCourses(params: {
  q: string;
  topic: "all" | CourseTopic;
  sort: CourseSort;
}) {
  const qq = (params.q || "").trim().toLowerCase();

  let list = COURSES.filter((c) => {
    if (params.topic !== "all" && c.topic !== params.topic) return false;
    if (!qq) return true;
    const hay = (c.title + " " + c.desc).toLowerCase();
    return hay.includes(qq);
  });

  // sort
  if (params.sort === "new") list = [...list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (params.sort === "high") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
  if (params.sort === "low") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
  if (params.sort === "best") list = [...list].sort((a, b) => (b.popular || 0) - (a.popular || 0));

  return list;
}

export function getCourseById(id?: string | null) {
  if (!id) return COURSES[0];
  const found = COURSES.find((c) => c.id.toUpperCase() === String(id).toUpperCase());
  return found || COURSES[0];
}
