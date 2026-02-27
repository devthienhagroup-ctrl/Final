export const COMPARE_PRODUCT_STORAGE_KEY = "aya_compare_products_v1";
export const MAX_COMPARE_PRODUCTS = 3;
export const MIN_COMPARE_PRODUCTS = 2;

export function readCompareProductIds(): string[] {
    try {
        const raw = localStorage.getItem(COMPARE_PRODUCT_STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
        return data.map((x) => String(x)).filter(Boolean);
    } catch {
        return [];
    }
}

export function writeCompareProductIds(ids: string[]) {
    const cleaned = Array.from(new Set(ids.map((id) => String(id)).filter(Boolean))).slice(0, MAX_COMPARE_PRODUCTS);
    localStorage.setItem(COMPARE_PRODUCT_STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent("aya_compare_changed", { detail: cleaned }));
    return cleaned;
}

export function addCompareProductId(id: string) {
    const current = readCompareProductIds().filter((x) => x !== id);
    current.unshift(id);
    return writeCompareProductIds(current);
}
