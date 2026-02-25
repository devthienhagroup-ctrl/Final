export type LanguageCode = "vi" | "en" | "ja";

export type ProductTranslation = {
  lang: LanguageCode;
  name: string;
  shortDescription: string;
  description: string;
};

export type ProductIngredient = {
  id: string;
  name: string;
  note: string;
};

export type ProductAttribute = {
  id: string;
  key: string;
  value: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  description?: string;
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
  updatedAt: string;
};

export const LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" }
];
