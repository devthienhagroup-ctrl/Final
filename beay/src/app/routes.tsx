import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { LoginPage } from '../pages/admin/LoginPage'
import { AdminRbacPage } from '../pages/admin/AdminRbacPage'
import { StudentPortalPage } from '../pages/admin/StudentPortalPage'
import { StudentCourseDetailPage } from '../pages/admin/StudentCourseDetailPage'
import { StudentLessonPlayerPage } from '../pages/admin/StudentLessonPlayerPage'
import AdminSpaPage from '../pages/admin/AdminSpaPage'
import AdminCoursesPage from '../pages/admin/AdminCoursesPage'
import { InstructorDashboardPage } from '../pages/admin/InstructorDashboardPage'
import { CmsEditPage } from "../admin/pages/CmsEditPage";
import { ToastProvider as AdminToastProvider } from "../admin/components/Toast";
import { CmsPagesPage } from "../admin/pages/CmsPagesPage";
import  OrderAdminPage  from "../admin/pages/OrderAdminPage";
import { ReviewsAdminPage } from "../admin/pages/ReviewsAdminPage";
import { BlogAdminPage } from "../admin/pages/BlogAdminPage";
import { ProductAdminListPage } from "../admin/pages/ProductAdminListPage";
import { ProductAdminDetailPage } from "../admin/pages/ProductAdminDetailPage";



function RequireAuth() {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}

function RequirePermission({ permission, children }: { permission: string; children: React.ReactNode }) {
    const { can } = useAuth();

    if (!can(permission)) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />


      <Route element={<RequireAuth />}>

        <Route path="/admin/orders" element={<RequirePermission permission="orders.read"><OrderAdminPage /></RequirePermission>} />
        <Route path="/admin/rbac" element={<RequirePermission permission="role.read"><AdminRbacPage /></RequirePermission>} />
        <Route path="/admin/services" element={<RequirePermission permission="spa_services.read"><AdminSpaPage /></RequirePermission>} />
        <Route path="/admin/courses" element={<RequirePermission permission="courses.read"><AdminCoursesPage /></RequirePermission>} />
        <Route path="/admin/reviews" element={<RequirePermission permission="reviews.read"><ReviewsAdminPage /></RequirePermission>} />
        <Route path="/admin/blog" element={<RequirePermission permission="blogs.read"><BlogAdminPage /></RequirePermission>} />
        <Route path="/admin/product" element={<RequirePermission permission="products.read"><ProductAdminListPage /></RequirePermission>} />
        <Route path="/admin/product/:productId" element={<RequirePermission permission="products.read"><ProductAdminDetailPage /></RequirePermission>} />
        <Route path="/student" element={<RequirePermission permission="my_courses.read"><StudentPortalPage /></RequirePermission>} />
        <Route path="/instructor" element={<RequirePermission permission="courses.write"><InstructorDashboardPage /></RequirePermission>} />
        <Route path="/student/courses/:id" element={<RequirePermission permission="my_courses.read"><StudentCourseDetailPage /></RequirePermission>} />
        <Route path="/student/lessons/:id" element={<RequirePermission permission="my_courses.read"><StudentLessonPlayerPage /></RequirePermission>} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route
              path="/admin/cms"
              element={<RequirePermission permission="cms.read"><AdminToastProvider><CmsPagesPage /></AdminToastProvider></RequirePermission>}
          />
          <Route
              path="/admin/cms/pages/:slug"
              element={<RequirePermission permission="cms.write"><AdminToastProvider><CmsEditPage /></AdminToastProvider></RequirePermission>}
          />
      </Route>

            <Route path="*" element={<div className="p-6">404</div>} />
        </Routes>
    );

}
