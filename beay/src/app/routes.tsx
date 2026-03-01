
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/orders" element={<AdminOrdersPage />} />
      <Route path="*" element={<div className="p-6">404</div>} />
      

      {/* TODO: tách tiếp theo thứ tự */}
      {/* /admin/orders */}
      {/* /admin/rbac */}
      {/* /instructor */}
      {/* /student */}

      <Route path="*" element={<div className="p-6">404</div>} />
    </Routes>
  );
}