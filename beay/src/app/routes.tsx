import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { LoginPage } from '../pages/admin/LoginPage'
import { AdminRbacPage } from '../pages/admin/AdminRbacPage'
import AdminSpaPage from '../pages/admin/AdminSpaPage'
import AdminCoursesPage from '../pages/admin/AdminCoursesPage'
import { CmsEditPage } from "../admin/pages/CmsEditPage";
import { ToastProvider as AdminToastProvider } from "../admin/components/Toast";
import { CmsPagesPage } from "../admin/pages/CmsPagesPage";
import  OrderAdminPage  from "../admin/pages/OrderAdminPage";
import { ReviewsAdminPage } from "../admin/pages/ReviewsAdminPage";
import { BlogAdminPage } from "../admin/pages/BlogAdminPage";
import { ProductAdminListPage } from "../admin/pages/ProductAdminListPage";
import { ProductAdminDetailPage } from "../admin/pages/ProductAdminDetailPage";
import { AdminUserManagementPage } from '../pages/admin/AdminUserManagementPage'
import { CoursePlansAdminPage } from '../pages/admin/CoursePlansAdminPage'
import { ErrorStatusPage } from '../pages/ErrorStatusPage';



function RequireAuth() {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}

function RequirePermission({ permission, children }: { permission: string; children: React.ReactNode }) {
    const { can } = useAuth();

    if (!can(permission)) {
        return (
            <ErrorStatusPage
                code={403}
                title="403 - Không có quyền truy cập"
                message="Tài khoản của bạn đã đăng nhập nhưng chưa được cấp quyền để vào trang này."
            />
        );
    }

    return <>{children}</>;
}

function FallbackRoute() {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <ErrorStatusPage
            code={404}
            title="404 - Không tìm thấy trang"
            message="Đường dẫn không tồn tại hoặc đã được thay đổi. Vui lòng kiểm tra lại đường dẫn."
        />
    );
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
                <Route path="/admin/orders" element={<RequirePermission permission="orders.write"><OrderAdminPage /></RequirePermission>} />
                <Route
                    path="/admin/rbac"
                    element={
                        <RequirePermission permission="role.write">
                            <Navigate to="/admin/rbac/rbac" replace />
                        </RequirePermission>
                    }
                />
                <Route path="/admin/rbac/:tab" element={<RequirePermission permission="role.write"><AdminRbacPage /></RequirePermission>} />
                <Route path="/admin/services" element={<RequirePermission permission="spa_services.write"><AdminSpaPage /></RequirePermission>} />
                <Route path="/admin/courses" element={<RequirePermission permission="courses.read"><AdminCoursesPage /></RequirePermission>} />
                <Route path="/admin/reviews" element={<RequirePermission permission="reviews.write"><ReviewsAdminPage /></RequirePermission>} />
                <Route path="/admin/blog" element={<RequirePermission permission="blogs.write"><BlogAdminPage /></RequirePermission>} />
                <Route path="/admin/product" element={<RequirePermission permission="products.write"><ProductAdminListPage /></RequirePermission>} />
                <Route path="/admin/product/:productId" element={<RequirePermission permission="products.write"><ProductAdminDetailPage /></RequirePermission>} />
                <Route path="/admin/users" element={<RequirePermission permission="role.write"><AdminUserManagementPage /></RequirePermission>} />
                <Route path="/admin/course-plans" element={<RequirePermission permission="packages.read"><CoursePlansAdminPage /></RequirePermission>} />
                <Route path="/admin/dashboard" element={<RequirePermission permission="dashboard.admin"><AdminDashboardPage /></RequirePermission>} />
                <Route
                    path="/admin/cms"
                    element={<RequirePermission permission="cms.read"><AdminToastProvider><CmsPagesPage /></AdminToastProvider></RequirePermission>}
                />
                <Route
                    path="/admin/cms/pages/:slug"
                    element={<RequirePermission permission="cms.write"><AdminToastProvider><CmsEditPage /></AdminToastProvider></RequirePermission>}
                />
            </Route>

            <Route path="*" element={<FallbackRoute />} />
        </Routes>
    );

}

