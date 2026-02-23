// src/app/types.ts

export type Lang = "vi" | "en" | "de";

// re-export CMS types (để app/api.ts chỉ import từ 1 nơi)
export type {
  CmsPageRes,
  CmsLocale,
  CmsSectionKey,
  CmsSection,
  CmsDataByKey,
  HeroData,
  AboutData,
  CardsData,
  CtaData,
  FooterData,
} from "../types/cms";

// ===== Leads payloads =====

export type LeadBookPayload = {
  name: string;
  phone: string;
  date: string; // yyyy-mm-dd
  time: "morning" | "afternoon" | "evening" | "any";
  note?: string;

  // ✅ add (fix TS error in AyaModal.tsx)
  lang?: Lang;
  pageSlug?: string;
};

export type LeadTalkPayload = {
  contact: string; // email/phone
  topic: "question" | "schedule" | "experience" | "other";
  message: string;

  // ✅ add (fix TS error in AyaModal.tsx)
  lang?: Lang;
  pageSlug?: string;
};
