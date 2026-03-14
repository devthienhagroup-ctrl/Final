import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { LoginPage } from '../pages/admin/LoginPage'
import { StudentPortalPage } from '../pages/admin/StudentPortalPage'
import { StudentCourseDetailPage } from '../pages/admin/StudentCourseDetailPage'
import { StudentLessonPlayerPage } from '../pages/admin/StudentLessonPlayerPage'
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
            <Route path="/" element={<Navigate to="/student" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
                <Route path="/student" element={<RequirePermission permission="my_courses.read"><StudentPortalPage /></RequirePermission>} />
                <Route path="/student/courses/:id" element={<RequirePermission permission="my_courses.read"><StudentCourseDetailPage /></RequirePermission>} />
                <Route path="/student/lessons/:id" element={<RequirePermission permission="my_courses.read"><StudentLessonPlayerPage /></RequirePermission>} />

            </Route>
	    <Route path="/require-permission" element={
                <ErrorStatusPage
                    code={403}
                    title="403 - Không có quyền truy cập"
                    message="Tài khoản của bạn đã đăng nhập nhưng chưa được cấp quyền để vào trang này."
                />
            } />

            <Route path="*" element={<FallbackRoute />} />
        </Routes>
    );

}
