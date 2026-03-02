export function safeJsonParse<T>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}
