export type LanguageCode = string;

export type AdminLanguage = {
  code: LanguageCode;
  label: string;
};

export type ProductTranslation = {
  lang: LanguageCode;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  guideContent: ProductGuideContent;
};

export type ProductGuideStep = {
  order: number;
  content: string;
};

export type ProductGuideContent = {
  intro: string;
  steps: ProductGuideStep[];
};

export type LocalizedTextMap = Record<LanguageCode, string>;

export type ProductIngredient = {
  id: string;
  nameByLang: LocalizedTextMap;
  note: string;
};

export type ProductAttribute = {
  id: string;
  keyByLang: LocalizedTextMap;
  value: string;
};

export type ProductImage = {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type CategoryTranslation = {
  lang: LanguageCode;
  name: string;
  description: string;
};

export type ProductCategory = {
  id: string;
  translations: CategoryTranslation[];
};

export type ProductAdminItem = {
  id: string;
  sku: string;
  categoryId: string;
  price: number;
  stock: number;
  status: "active" | "draft";
  translations: ProductTranslation[];
  ingredients: ProductIngredient[];
  attributes: ProductAttribute[];
  images: ProductImage[];
  updatedAt: string;
};

export type ProductListFilters = {
  search?: string;
  status?: "active" | "draft" | "all";
  categoryId?: string;
  page?: number;
  pageSize?: number;
};

export type ProductListResponse = {
  items: ProductAdminItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
