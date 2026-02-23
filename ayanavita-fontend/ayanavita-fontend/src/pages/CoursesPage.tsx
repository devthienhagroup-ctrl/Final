import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { coursesApi, type Course } from "../api/courses.api";
import { useAuth } from "../auth/AuthProvider";

export function CoursesPage() {
  const { logout, user } = useAuth();
  const [items, setItems] = useState<Course[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const data = await coursesApi.list();
        setItems(data);
      } catch (e: any) {
        setErr(e?.message || "Load courses failed");
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Khoá học</h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span>{user?.email}</span>

          <Link to="/me/courses">Khoá học của tôi</Link>
          <Link to="/me/orders">Đơn hàng của tôi</Link>


          {user?.role === "ADMIN" && <Link to="/admin/orders">Admin Orders</Link>}

          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {err && (
        <div style={{ color: "crimson", marginTop: 10 }}>
          {err}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 12,
        }}
      >
        {items.map((c: Course) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 700 }}>{c.title}</div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>{c.description}</div>
            <div style={{ marginTop: 8 }}>
              Giá: {c.price.toLocaleString("vi-VN")}đ
            </div>
            <div style={{ marginTop: 10 }}>
              <Link to={`/courses/${c.id}`}>Xem chi tiết</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
