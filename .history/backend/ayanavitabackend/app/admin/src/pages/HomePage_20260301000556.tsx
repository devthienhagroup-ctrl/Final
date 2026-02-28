import React from "react";
import { Link } from "react-router-dom";
import { AppAlert } from "../components/AppAlert";

const menuItems = [
  {
    title: "CMS Pages",
    desc: "Quản lý nội dung trang, chỉnh sửa section, preview nhanh trước khi publish.",
    to: "/cms/pages",
    icon: "✦",
  },
  {
    title: "Leads",
    desc: "Theo dõi book/talk submissions với bảng dữ liệu rõ ràng và lọc nhanh.",
    to: "/leads",
    icon: "★",
  },
  {
    title: "Products",
    desc: "Danh sách sản phẩm đa ngôn ngữ, chỉnh sửa thông tin và trạng thái.",
    to: "/catalog/products",
    icon: "⬢",
  },
  {
    title: "Catalog CRUD",
    desc: "Tạo/sửa/xóa nhanh catalog entries phục vụ quản trị nội bộ.",
    to: "/catalog/crud",
    icon: "◉",
  },
];

export function HomePage() {
  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card hero-card">
        <p className="muted" style={{ margin: 0 }}>Trang chủ quản trị</p>
        <h1 className="h1" style={{ marginTop: 10 }}>Ayanavita Admin Hub</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 760 }}>
          Thiết kế mới theo hướng modern/minimalist, tối ưu khả năng thao tác: điều hướng rõ ràng,
          thẻ chức năng trực quan, và alert nhấn mạnh trạng thái quan trọng.
        </p>
      </section>

      <AppAlert
        kind="info"
        title="Thông báo"
        message="Sau khi đăng nhập hệ thống sẽ vào trang này để bạn truy cập nhanh toàn bộ chức năng quản trị."
      />

      <section className="grid grid-2">
        {menuItems.map((item) => (
          <article className="card menu-card" key={item.to}>
            <div className="menu-icon" aria-hidden="true">{item.icon}</div>
            <div>
              <h2 className="h2" style={{ marginBottom: 8 }}>{item.title}</h2>
              <p className="muted" style={{ margin: 0 }}>{item.desc}</p>
            </div>
            <div style={{ marginTop: 14 }}>
              <Link to={item.to} className="btn btn-primary">Mở chức năng</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
