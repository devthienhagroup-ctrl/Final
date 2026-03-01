import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { LoginPage } from "../pages/admin/LoginPage";
import { AdminRbacPage } from "../pages/admin/AdminRbacPage";

function RequireAuth() {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="/admin/login" element={<LoginPage />} />

            {/* TODO: tách tiếp theo thứ tự */}
            {/* /admin/orders */}
            {/* /admin/rbac */}
            {/* /instructor */}
            {/* /student */}
            <Route element={<RequireAuth />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/rbac" element={<AdminRbacPage />} />
                <Route path="/student" element={<StudentPortalPage />} />
            </Route>

            <Route path="*" element={<div className="p-6">404</div>} />
        </Routes>
    );

}