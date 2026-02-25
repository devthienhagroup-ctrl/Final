import { http } from "./http";
import {
  LANGUAGES,
  type LanguageCode,
  type ProductAdminItem,
  type ProductAttribute,
  type ProductCategory,
  type ProductIngredient,
  type ProductTranslation
} from "../types/productAdmin";

const STORAGE_KEY = "aya_admin_products_v1";
const CATEGORY_STORAGE_KEY = "aya_admin_categories_v1";

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultTranslations = (): ProductTranslation[] =>
  LANGUAGES.map((item) => ({
    lang: item.code,
    name: "",
    shortDescription: "",
    description: ""
  }));

const defaultCategories: ProductCategory[] = [
  { id: "cat-cleanser", name: "Sữa rửa mặt", description: "Làm sạch dịu nhẹ" },
  { id: "cat-serum", name: "Serum", description: "Đặc trị và phục hồi" }
];

const defaultProducts: ProductAdminItem[] = [
  {
    id: "prd-001",
    sku: "AYA-CLEAN-001",
    categoryId: "cat-cleanser",
    price: 289000,
    stock: 50,
    status: "active",
    translations: [
      {
        lang: "vi",
        name: "Sữa rửa mặt dịu nhẹ",
        shortDescription: "Làm sạch - giữ ẩm",
        description: "Làm sạch da và cân bằng độ pH."
      },
      {
        lang: "en",
        name: "Gentle Cleanser",
        shortDescription: "Clean & hydrate",
        description: "Removes dirt while keeping skin hydrated."
      },
      {
        lang: "ja",
        name: "ジェントルクレンザー",
        shortDescription: "洗浄と保湿",
        description: "肌をやさしく洗い、うるおいを守ります。"
      }
    ],
    ingredients: [
      { id: uid(), name: "Niacinamide", note: "2%" },
      { id: uid(), name: "Aloe Vera", note: "Làm dịu" }
    ],
    attributes: [
      { id: uid(), key: "Dung tích", value: "150ml" },
      { id: uid(), key: "Loại da", value: "Mọi loại da" }
    ],
    updatedAt: new Date().toISOString()
  }
];

const readLocalProducts = (): ProductAdminItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
    return defaultProducts;
  }
  return JSON.parse(raw) as ProductAdminItem[];
};

const writeLocalProducts = (products: ProductAdminItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

const readLocalCategories = (): ProductCategory[] => {
  const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(defaultCategories));
    return defaultCategories;
  }
  return JSON.parse(raw) as ProductCategory[];
};

const writeLocalCategories = (categories: ProductCategory[]) => {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
};

export async function fetchAdminProducts(): Promise<ProductAdminItem[]> {
  try {
    const res = await http.get("/admin/products");
    return (res.data?.data ?? res.data ?? []) as ProductAdminItem[];
  } catch {
    return readLocalProducts();
  }
}

export async function fetchAdminProductById(id: string): Promise<ProductAdminItem | null> {
  try {
    const res = await http.get(`/admin/products/${id}`);
    return (res.data?.data ?? res.data ?? null) as ProductAdminItem | null;
  } catch {
    return readLocalProducts().find((item) => item.id === id) ?? null;
  }
}

export async function createAdminProduct(): Promise<ProductAdminItem> {
  const payload: ProductAdminItem = {
    id: `prd-${uid()}`,
    sku: `AYA-${uid().toUpperCase()}`,
    categoryId: "",
    price: 0,
    stock: 0,
    status: "draft",
    translations: defaultTranslations(),
    ingredients: [],
    attributes: [],
    updatedAt: new Date().toISOString()
  };

  try {
    const res = await http.post("/admin/products", payload);
    return (res.data?.data ?? payload) as ProductAdminItem;
  } catch {
    const products = readLocalProducts();
    const next = [payload, ...products];
    writeLocalProducts(next);
    return payload;
  }
}

export async function updateAdminProduct(item: ProductAdminItem): Promise<ProductAdminItem> {
  const payload = { ...item, updatedAt: new Date().toISOString() };

  try {
    const res = await http.put(`/admin/products/${item.id}`, payload);
    return (res.data?.data ?? payload) as ProductAdminItem;
  } catch {
    const products = readLocalProducts();
    const next = products.map((product) => (product.id === item.id ? payload : product));
    writeLocalProducts(next);
    return payload;
  }
}

export async function fetchAdminCategories(): Promise<ProductCategory[]> {
  try {
    const res = await http.get("/admin/product-categories");
    return (res.data?.data ?? res.data ?? []) as ProductCategory[];
  } catch {
    return readLocalCategories();
  }
}

export async function createAdminCategory(name: string, description: string): Promise<ProductCategory> {
  const payload: ProductCategory = { id: `cat-${uid()}`, name, description };
  try {
    const res = await http.post("/admin/product-categories", payload);
    return (res.data?.data ?? payload) as ProductCategory;
  } catch {
    const categories = readLocalCategories();
    const next = [payload, ...categories];
    writeLocalCategories(next);
    return payload;
  }
}

export async function updateAdminCategory(category: ProductCategory): Promise<ProductCategory> {
  try {
    const res = await http.put(`/admin/product-categories/${category.id}`, category);
    return (res.data?.data ?? category) as ProductCategory;
  } catch {
    const categories = readLocalCategories();
    const next = categories.map((item) => (item.id === category.id ? category : item));
    writeLocalCategories(next);
    return category;
  }
}

export async function deleteAdminCategory(categoryId: string): Promise<void> {
  try {
    await http.delete(`/admin/product-categories/${categoryId}`);
  } catch {
    const categories = readLocalCategories();
    const next = categories.filter((item) => item.id !== categoryId);
    writeLocalCategories(next);
  }
}

export function upsertTranslation(
  translations: ProductTranslation[],
  lang: LanguageCode,
  patch: Partial<ProductTranslation>
): ProductTranslation[] {
  const existing = translations.find((item) => item.lang === lang);
  if (!existing) {
    return [...translations, { lang, name: "", shortDescription: "", description: "", ...patch }];
  }
  return translations.map((item) => (item.lang === lang ? { ...item, ...patch } : item));
}

export const createIngredient = (): ProductIngredient => ({ id: uid(), name: "", note: "" });
export const createAttribute = (): ProductAttribute => ({ id: uid(), key: "", value: "" });
