import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { coursesApi, type Course } from "../api/courses.api";
import { useAuth } from "../state/auth.store";
import { studentLanguageMeta, useStudentViewPrefs, type StudentLang } from "../hooks/useStudentViewPrefs";
import "./StudentCoursesTheme.css";

const i18n: Record<StudentLang, Record<string, string>> = {
  vi: {
    title: "Khoá học",
    mine: "Khoá học của tôi",
    orders: "Đơn hàng của tôi",
    adminOrders: "Admin Orders",
    adminCourses: "Admin Courses",
    logout: "Đăng xuất",
    detail: "Xem chi tiết",
    price: "Giá",
    darkMode: "Chế độ tối",
    loadingFail: "Tải khoá học thất bại",
    subtitle: "Khám phá thư viện khoá học theo phong cách mới.",
  },
  en: {
    title: "Courses",
    mine: "My Courses",
    orders: "My Orders",
    adminOrders: "Admin Orders",
    adminCourses: "Admin Courses",
    logout: "Logout",
    detail: "View details",
    price: "Price",
    darkMode: "Dark mode",
    loadingFail: "Load courses failed",
    subtitle: "Discover the upgraded course catalog experience.",
  },
  de: {
    title: "Kurse",
    mine: "Meine Kurse",
    orders: "Meine Bestellungen",
    adminOrders: "Admin-Bestellungen",
    adminCourses: "Admin-Kurse",
    logout: "Abmelden",
    detail: "Details ansehen",
    price: "Preis",
    darkMode: "Dunkler Modus",
    loadingFail: "Kurse konnten nicht geladen werden",
    subtitle: "Entdecke das modernisierte Kursportal.",
  },
};

export function CoursesPage() {
  const { logout, user } = useAuth();
  const { lang, setLang, theme, setTheme } = useStudentViewPrefs();
  const t = i18n[lang];
  const [items, setItems] = useState<Course[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const data = await coursesApi.list();
        setItems(data);
      } catch (e: any) {
        setErr(e?.message || t.loadingFail);
      }
    })();
  }, [t.loadingFail]);

  const wrapClass = useMemo(
    () => `student-page student-courses-theme ${theme === "dark" ? "student-courses-theme-dark" : ""}`,
    [theme]
  );

  return (
    <div className={wrapClass}>
      <div className="student-shell">
        <div className="student-topbar">
          <div>
            <h2 style={{ margin: 0 }}>{t.title}</h2>
            <div style={{ opacity: 0.9, marginTop: 4 }}>{t.subtitle}</div>
          </div>
          <div className="student-control-group">
            <button className="student-theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {t.darkMode}: {theme === "dark" ? "ON" : "OFF"}
            </button>
            <div className="student-lang-switch">
              {(Object.keys(studentLanguageMeta) as StudentLang[]).map((code) => (
                <button
                  key={code}
                  className={`student-lang-option ${lang === code ? "active" : ""}`}
                  onClick={() => setLang(code)}
                  title={studentLanguageMeta[code].label}
                >
                  <img src={studentLanguageMeta[code].flagUrl} alt={studentLanguageMeta[code].label} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
          <span className="student-muted">{user?.email}</span>
          <Link to="/me/courses">{t.mine}</Link>
          <Link to="/me/orders">{t.orders}</Link>
          {user?.role === "ADMIN" && <Link to="/admin/orders">{t.adminOrders}</Link>}
          {user?.role === "ADMIN" && <Link to="/admin/cources">{t.adminCourses}</Link>}
          <button onClick={logout}>{t.logout}</button>
        </div>

        {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
          {items.map((c: Course) => (
            <div key={c.id} className="student-card">
              <div style={{ fontWeight: 800 }}>{c.title}</div>
              <div className="student-muted" style={{ marginTop: 6 }}>{c.description}</div>
              <div style={{ marginTop: 8 }}>{t.price}: {c.price.toLocaleString("vi-VN")}đ</div>
              <div style={{ marginTop: 10 }}>
                <Link to={`/courses/${c.id}`}>{t.detail}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
