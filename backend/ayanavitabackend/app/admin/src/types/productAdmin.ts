export type LanguageCode = string;

export type AdminLanguage = {
  code: LanguageCode;
  label: string;
};

export type ProductTranslation = {
  lang: LanguageCode;
  name: string;
  shortDescription: string;
  description: string;
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
  updatedAt: string;
};
