import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { LoginPage } from "../pages/admin/LoginPage";
import { AdminRbacPage } from "../pages/admin/AdminRbacPage";
import { CmsEditPage } from "../admin/pages/CmsEditPage";
import { ToastProvider as AdminToastProvider } from "../admin/components/Toast";
import { CmsPagesPage } from "../admin/pages/CmsPagesPage";
import  OrderAdminPage  from "../admin/pages/OrderAdminPage";
import { ReviewsAdminPage } from "../admin/pages/ReviewsAdminPage";
import { BlogAdminPage } from "../admin/pages/BlogAdminPage";

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
                <Route path="/admin/orders" element={<OrderAdminPage />} />
                <Route path="/admin/rbac" element={<AdminRbacPage />} />
                <Route path="/admin/reviews" element={<ReviewsAdminPage />} />
                <Route path="/admin/blog" element={<BlogAdminPage />} />
                <
                <Route
                    path="/admin/cms"
                    element={(
                        <AdminToastProvider>
                            <CmsPagesPage />
                        </AdminToastProvider>
                    )}
                />
                <Route
                    path="/admin/cms/pages/:slug"
                    element={(
                        <AdminToastProvider>
                            <CmsEditPage />
                        </AdminToastProvider>
                    )}
                />
\\
            </Route>

            <Route path="*" element={<div className="p-6">404</div>} />
        </Routes>
    );

}
