import { api } from "../lib/http";
import { API_BASE } from "../env";
import {
  type AdminLanguage,
  type LanguageCode,
  type ProductAdminItem,
  type ProductAttribute,
  type ProductCategory,
  type ProductIngredient,
  type ProductTranslation,
  type ProductGuideContent,
  type ProductImage,
  type ProductListFilters,
  type ProductListResponse,
} from "../types/productAdmin";

const uid = () => Math.random().toString(36).slice(2, 10);

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || `item-${uid()}`;

const defaultLanguages: AdminLanguage[] = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

let languageCache: AdminLanguage[] | null = null;

const emptyGuideContent = (): ProductGuideContent => ({
  intro: "",
  steps: [],
});

const normalizeGuideContent = (value: unknown): ProductGuideContent => {
  if (!value || typeof value !== "object") return emptyGuideContent();

  const raw = value as { intro?: unknown; steps?: unknown };
  const intro = typeof raw.intro === "string" ? raw.intro : "";
  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .map((step) => {
          if (!step || typeof step !== "object") return null;
          const s = step as { order?: unknown; content?: unknown };
          const content = typeof s.content === "string" ? s.content : "";
          const order = Number(s.order);
          if (!content) return null;
          return { order: Number.isFinite(order) && order > 0 ? Math.floor(order) : 1, content };
        })
        .filter((step): step is { order: number; content: string } => Boolean(step))
        .sort((a, b) => a.order - b.order)
    : [];

  return { intro, steps };
};

export async function fetchCatalogLanguages(): Promise<AdminLanguage[]> {
  if (languageCache) return languageCache;
  try {
    const rows = await api<Array<{ code: string; name: string }>>("/catalog/languages");
    languageCache =
      rows.map((row) => ({ code: row.code, label: row.name })) || defaultLanguages;
  } catch {
    languageCache = defaultLanguages;
  }
  return languageCache;
}

const ensureTranslations = (
  languages: AdminLanguage[],
  rows: Array<{
    languageCode: string;
    name?: string;
    slug?: string;
    shortDescription?: string;
    description?: string;
    guideContent?: unknown;
  }> = [],
): ProductTranslation[] =>
  languages.map((lang) => {
    const found = rows.find((item) => item.languageCode === lang.code);
    return {
      lang: lang.code,
      name: found?.name || "",
      slug: found?.slug || slugify(found?.name || `${lang.code}-${uid()}`),
      shortDescription: found?.shortDescription || "",
      description: found?.description || "",
      guideContent: normalizeGuideContent(found?.guideContent),
    };
  });

type ApiCategory = {
  id: string | number;
  translations?: Array<{ languageCode: string; name: string; description?: string }>;
};

type ApiAttributeKey = {
  id: string | number;
  code: string;
  translations?: Array<{ languageCode: string; displayName: string }>;
};

type ApiIngredientKey = {
  id: string | number;
  code: string;
  translations?: Array<{ languageCode: string; displayName: string }>;
};

const loadAttributeKeys = async (): Promise<Record<string, ApiAttributeKey>> => {
  const rows = await api<ApiAttributeKey[]>("/catalog/attributes");
  return Object.fromEntries(rows.map((item) => [String(item.id), item]));
};

const loadIngredientKeys = async (): Promise<Record<string, ApiIngredientKey>> => {
  const rows = await api<ApiIngredientKey[]>("/catalog/ingredients");
  return Object.fromEntries(rows.map((item) => [String(item.id), item]));
};

const mapCategory = (item: ApiCategory, languages: AdminLanguage[]): ProductCategory => ({
  id: String(item.id),
  translations: languages.map((lang) => {
    const found = item.translations?.find((row) => row.languageCode === lang.code);
    return {
      lang: lang.code,
      name: found?.name || "",
      description: found?.description || "",
    };
  }),
});

type ApiProduct = {
  id: string | number;
  sku: string;
  categoryId?: string | number | null;
  price: number;
  status?: string;
  stock?: number;
  updatedAt?: string;
  translations?: Array<{
    languageCode: string;
    name: string;
    slug?: string;
    shortDescription?: string;
    description?: string;
    guideContent?: unknown;
  }>;
  attributes?: Array<{ attributeKeyId: string | number; valueText?: string; valueNumber?: number }>;
  ingredients?: Array<{ ingredientKeyId: string | number; note?: string; value?: string }>;
  images?: Array<{ id: string | number; imageUrl: string; isPrimary?: boolean; sortOrder?: number }>;
};

const mapProduct = (
  item: ApiProduct,
  languages: AdminLanguage[],
  ingredientKeys: Record<string, ApiIngredientKey> = {},
  attributeKeys: Record<string, ApiAttributeKey> = {},
): ProductAdminItem => ({
  id: String(item.id),
  sku: item.sku,
  categoryId: item.categoryId ? String(item.categoryId) : "",
  price: Number(item.price || 0),
  stock: Number(item.stock || 0),
  status: item.status === "active" ? "active" : "draft",
  translations: ensureTranslations(languages, item.translations),
  ingredients: (item.ingredients || []).map((row) => {
    const key = ingredientKeys[String(row.ingredientKeyId)];
    const nameByLang = Object.fromEntries(
      languages.map((lang) => [
        lang.code,
        key?.translations?.find((x) => x.languageCode === lang.code)?.displayName || "",
      ]),
    );

    return {
      id: String(row.ingredientKeyId),
      nameByLang,
      note: row.note || row.value || "",
    };
  }),
  attributes: (item.attributes || []).map((row) => {
    const key = attributeKeys[String(row.attributeKeyId)];
    const keyByLang = Object.fromEntries(
      languages.map((lang) => [
        lang.code,
        key?.translations?.find((x) => x.languageCode === lang.code)?.displayName || "",
      ]),
    );

    return {
      id: String(row.attributeKeyId),
      keyByLang,
      value: row.valueText || String(row.valueNumber ?? ""),
    };
  }),
  images: (item.images || []).map((row) => ({
    id: String(row.id),
    imageUrl: row.imageUrl,
    isPrimary: Boolean(row.isPrimary),
    sortOrder: Number(row.sortOrder || 0),
  })),
  updatedAt: item.updatedAt || new Date().toISOString(),
});

const toProductPayload = (item: ProductAdminItem) => ({
  sku: item.sku,
  categoryId: item.categoryId ? Number(item.categoryId) : null,
  price: Number(item.price || 0),
  status: item.status,
  translations: item.translations.map((row) => ({
    languageCode: row.lang,
    name: row.name || "",
    slug: row.slug?.trim() || slugify(row.name || `${item.sku}-${row.lang}`),
    shortDescription: row.shortDescription || "",
    description: row.description || "",
    guideContent: row.guideContent,
  })),
});

export async function fetchAdminProducts(filters: ProductListFilters = {}): Promise<ProductListResponse> {
  const languages = await fetchCatalogLanguages();
  const query = new URLSearchParams();

  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.categoryId) query.set("categoryId", filters.categoryId);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.pageSize) query.set("pageSize", String(filters.pageSize));

  const endpoint = query.toString() ? `/catalog/products?${query.toString()}` : "/catalog/products";

  const [response, ingredientKeys, attributeKeys] = await Promise.all([
    api<{ items: ApiProduct[]; page: number; pageSize: number; total: number; totalPages: number }>(endpoint),
    loadIngredientKeys(),
    loadAttributeKeys(),
  ]);

  return {
    ...response,
    items: response.items.map((item) => mapProduct(item, languages, ingredientKeys, attributeKeys)),
  };
}

export async function fetchAdminProductById(id: string): Promise<ProductAdminItem | null> {
  const languages = await fetchCatalogLanguages();
  try {
    const [item, ingredientKeys, attributeKeys] = await Promise.all([
      api<ApiProduct>(`/catalog/products/${id}`),
      loadIngredientKeys(),
      loadAttributeKeys(),
    ]);
    return mapProduct(item, languages, ingredientKeys, attributeKeys);
  } catch {
    return null;
  }
}

export async function createAdminProduct(draft?: ProductAdminItem): Promise<ProductAdminItem> {
  const languages = await fetchCatalogLanguages();
  const payload = draft
    ? toProductPayload(draft)
    : {
        sku: `AYA-${uid().toUpperCase()}`,
        price: 0,
        status: "draft",
        translations: languages.map((lang) => ({
          languageCode: lang.code,
          name: "",
          slug: `new-${lang.code}-${uid()}`,
          shortDescription: "",
          description: "",
          guideContent: { intro: "", steps: [] },
        })),
      };
  const created = await api<ApiProduct>("/catalog/products", { method: "POST", body: JSON.stringify(payload) });
  return mapProduct(created, languages);
}

export async function updateAdminProduct(item: ProductAdminItem): Promise<ProductAdminItem> {
  const languages = await fetchCatalogLanguages();
  const product = await api<ApiProduct>(`/catalog/products/${item.id}`, {
    method: "PATCH",
    body: JSON.stringify(toProductPayload(item)),
  });

  const ingredientKeysByCode = await api<ApiIngredientKey[]>("/catalog/ingredients");
  const ingredientKeyMap = new Map(ingredientKeysByCode.map((k) => [k.code.toLowerCase(), k]));
  const ingredientItems: Array<{ ingredientKeyId: number; note: string; value: string; sortOrder: number }> = [];
  for (const [idx, ingredient] of item.ingredients.entries()) {
    const viName = ingredient.nameByLang.vi || ingredient.nameByLang.en || Object.values(ingredient.nameByLang)[0] || "";
    const code = slugify(viName || `ingredient-${idx}`);
    let key = ingredientKeyMap.get(code);
    if (!key) {
      key = await api<ApiIngredientKey>("/catalog/ingredients", {
        method: "POST",
        body: JSON.stringify({
          code,
          translations: languages.map((lang) => ({
            languageCode: lang.code,
            displayName: ingredient.nameByLang[lang.code] || viName || code,
          })),
        }),
      });
      ingredientKeyMap.set(code, key);
    } else {
      await api<ApiIngredientKey>(`/catalog/ingredients/${key.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          translations: languages.map((lang) => ({
            languageCode: lang.code,
            displayName: ingredient.nameByLang[lang.code] || viName || code,
          })),
        }),
      });
    }
    ingredientItems.push({ ingredientKeyId: Number(key.id), note: ingredient.note || "", value: ingredient.note || "", sortOrder: idx });
  }

  const attributeKeysByCode = await api<ApiAttributeKey[]>("/catalog/attributes");
  const attributeKeyMap = new Map(attributeKeysByCode.map((k) => [k.code.toLowerCase(), k]));
  const attributeItems: Array<{ attributeKeyId: number; valueText: string }> = [];
  for (const [idx, attribute] of item.attributes.entries()) {
    const viName = attribute.keyByLang.vi || attribute.keyByLang.en || Object.values(attribute.keyByLang)[0] || "";
    const code = slugify(viName || `attribute-${idx}`);
    let key = attributeKeyMap.get(code);
    if (!key) {
      key = await api<ApiAttributeKey>("/catalog/attributes", {
        method: "POST",
        body: JSON.stringify({
          code,
          valueType: "text",
          translations: languages.map((lang) => ({
            languageCode: lang.code,
            displayName: attribute.keyByLang[lang.code] || viName || code,
          })),
        }),
      });
      attributeKeyMap.set(code, key);
    } else {
      await api<ApiAttributeKey>(`/catalog/attributes/${key.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          translations: languages.map((lang) => ({
            languageCode: lang.code,
            displayName: attribute.keyByLang[lang.code] || viName || code,
          })),
        }),
      });
    }
    attributeItems.push({ attributeKeyId: Number(key.id), valueText: attribute.value || "" });
  }

  await api(`/catalog/products/${item.id}/ingredients`, {
    method: "PATCH",
    body: JSON.stringify({ items: ingredientItems }),
  });

  await api(`/catalog/products/${item.id}/attributes`, {
    method: "PATCH",
    body: JSON.stringify({ items: attributeItems }),
  });

  const ingredientKeys = Object.fromEntries(Array.from(ingredientKeyMap.values()).map((v) => [String(v.id), v]));
  const attributeKeys = Object.fromEntries(Array.from(attributeKeyMap.values()).map((v) => [String(v.id), v]));
  return mapProduct(product, languages, ingredientKeys, attributeKeys);
}

export async function uploadProductImage(productId: string, file: File, isPrimary = false, sortOrder = 0): Promise<ProductImage> {
  const token = localStorage.getItem("aya_admin_token") || "";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("isPrimary", String(isPrimary));
  formData.append("sortOrder", String(sortOrder));

  const response = await fetch(`${API_BASE}/catalog/products/${productId}/images/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) throw new Error(await response.text());
  const row = (await response.json()) as { id: string | number; imageUrl: string; isPrimary?: boolean; sortOrder?: number };
  return {
    id: String(row.id),
    imageUrl: row.imageUrl,
    isPrimary: Boolean(row.isPrimary),
    sortOrder: Number(row.sortOrder || 0),
  };
}

export async function updateProductImage(productId: string, image: ProductImage): Promise<ProductImage> {
  const row = await api<{ id: string | number; imageUrl: string; isPrimary?: boolean; sortOrder?: number }>(
    `/catalog/products/${productId}/images/${image.id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        imageUrl: image.imageUrl,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      }),
    },
  );

  return {
    id: String(row.id),
    imageUrl: row.imageUrl,
    isPrimary: Boolean(row.isPrimary),
    sortOrder: Number(row.sortOrder || 0),
  };
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await api(`/catalog/products/${productId}/images/${imageId}`, { method: "DELETE" });
}

export async function fetchAdminCategories(): Promise<ProductCategory[]> {
  const languages = await fetchCatalogLanguages();
  const rows = await api<ApiCategory[]>("/catalog/categories");
  return rows.map((row) => mapCategory(row, languages));
}

export async function createAdminCategory(category: ProductCategory): Promise<ProductCategory> {
  const created = await api<ApiCategory>("/catalog/categories", {
    method: "POST",
    body: JSON.stringify({
      status: "active",
      translations: category.translations.map((row) => ({
        languageCode: row.lang,
        name: row.name,
        slug: slugify(`${row.name || "category"}-${row.lang}`),
        description: row.description || "",
      })),
    }),
  });
  const languages = await fetchCatalogLanguages();
  return mapCategory(created, languages);
}

export async function updateAdminCategory(category: ProductCategory): Promise<ProductCategory> {
  const updated = await api<ApiCategory>(`/catalog/categories/${category.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      translations: category.translations.map((row) => ({
        languageCode: row.lang,
        name: row.name,
        slug: slugify(`${row.name || "category"}-${row.lang}`),
        description: row.description || "",
      })),
    }),
  });
  const languages = await fetchCatalogLanguages();
  return mapCategory(updated, languages);
}

export async function deleteAdminCategory(categoryId: string): Promise<void> {
  await api(`/catalog/categories/${categoryId}`, { method: "DELETE" });
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  await api(`/catalog/products/${productId}`, { method: "DELETE" });
}

export function upsertTranslation(
  translations: ProductTranslation[],
  lang: LanguageCode,
  patch: Partial<ProductTranslation>,
): ProductTranslation[] {
  const existing = translations.find((item) => item.lang === lang);
  if (!existing) {
    return [...translations, { lang, name: "", slug: "", shortDescription: "", description: "", guideContent: emptyGuideContent(), ...patch }];
  }
  return translations.map((item) => (item.lang === lang ? { ...item, ...patch } : item));
}

export const createIngredient = (): ProductIngredient => ({ id: uid(), nameByLang: {}, note: "" });
export const createAttribute = (): ProductAttribute => ({ id: uid(), keyByLang: {}, value: "" });
