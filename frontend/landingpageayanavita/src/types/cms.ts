export type CmsLocale = "vi" | "en" | "de";

export type CmsSectionKey = "hero" | "about" | "cards" | "cta" | "footer";

export type HeroData = {
  pill?: string;
  title?: string;
  subtitle?: string;
};

export type AboutData = {
  title?: string;
  paragraphs?: string[];
};

export type CardsData = {
  items?: Array<{
    title?: string;
    desc?: string;
    tag?: string;
  }>;
};

export type CtaData = {
  title?: string;
  body?: string;
  hint?: string;
  primaryText?: string;
  secondaryText?: string;
};

export type FooterData = {
  left?: string;
  right?: string;
};

export type CmsDataByKey = {
  hero: HeroData;
  about: AboutData;
  cards: CardsData;
  cta: CtaData;
  footer: FooterData;
};

export type CmsSection<K extends CmsSectionKey = CmsSectionKey> = {
  id: number;
  key: K;
  sortOrder: number;
  data: CmsDataByKey[K] | null;
  publishedAt: string | null;
};

/** API response (thô) */
export type CmsPageRes = {
  slug: string;
  title: string;
  sections: CmsSection[];
};

/** UI model (đã chuẩn hoá) */
export type CmsPage = CmsPageRes & {
  byKey: Partial<Record<CmsSectionKey, CmsSection>>;
};
