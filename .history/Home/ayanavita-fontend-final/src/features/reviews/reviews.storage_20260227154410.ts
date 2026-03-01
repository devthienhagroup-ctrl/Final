import type { Review } from "./reviews.types";

export const REVIEWS_KEY = "aya_reviews_v1";
export const SAVED_KEY = "aya_reviews_saved_v1";
export const VOTE_KEY = "aya_reviews_helpful_v1"; // map reviewId => boolean

export function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadReviews(): Review[] {
  return safeParse<Review[]>(localStorage.getItem(REVIEWS_KEY), []);
}
export function saveReviews(arr: Review[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(arr));
}

export function loadSavedIds(): string[] {
  return safeParse<string[]>(localStorage.getItem(SAVED_KEY), []);
}
export function saveSavedIds(ids: string[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

export function loadVoteMap(): Record<string, boolean> {
  return safeParse<Record<string, boolean>>(localStorage.getItem(VOTE_KEY), {});
}
export function saveVoteMap(map: Record<string, boolean>) {
  localStorage.setItem(VOTE_KEY, JSON.stringify(map));
}

export function clearAllDemo() {
  localStorage.removeItem(REVIEWS_KEY);
  localStorage.removeItem(SAVED_KEY);
  localStorage.removeItem(VOTE_KEY);
}
