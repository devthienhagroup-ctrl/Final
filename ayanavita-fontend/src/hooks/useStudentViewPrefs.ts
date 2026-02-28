import { useEffect, useState } from "react";

export type StudentLang = "vi" | "en" | "de";
export type StudentTheme = "light" | "dark";

const THEME_KEY = "student-courses-theme-mode";
const LANG_KEY = "student-courses-lang";

export const studentLanguageMeta: Record<StudentLang, { label: string; flagUrl: string }> = {
  vi: { label: "Tiếng Việt", flagUrl: "https://flagcdn.com/w40/vn.png" },
  en: { label: "English", flagUrl: "https://flagcdn.com/w40/gb.png" },
  de: { label: "Deutsch", flagUrl: "https://flagcdn.com/w40/de.png" },
};

export function useStudentViewPrefs() {
  const [theme, setTheme] = useState<StudentTheme>(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === "dark" ? "dark" : "light";
  });

  const [lang, setLang] = useState<StudentLang>(() => {
    const saved = window.localStorage.getItem(LANG_KEY);
    return saved === "en" || saved === "de" ? saved : "vi";
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  return { theme, setTheme, lang, setLang };
}
