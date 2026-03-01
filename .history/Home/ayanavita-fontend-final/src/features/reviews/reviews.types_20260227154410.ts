export type ReviewCategory = "service" | "product";
export type ReviewSort = "new" | "helpful" | "high" | "low";
export type StarFilter = "all" | "1" | "2" | "3" | "4" | "5";

export type ReviewReply = { by: string; text: string };

export type Review = {
  id: string;
  name: string;
  anonymous: boolean;
  category: ReviewCategory;
  item: string;
  branch?: string;
  rating: number; // 1..5
  text: string;
  img: string;
  verified: boolean;
  helpful: number;
  createdAt: string; // ISO
  reply?: ReviewReply;
};

export type ReviewsState = {
  q: string;
  category: "all" | ReviewCategory;
  sort: ReviewSort;
  star: StarFilter;
  verifiedOnly: boolean;
};
