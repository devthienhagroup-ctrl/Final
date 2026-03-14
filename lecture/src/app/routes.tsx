import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { LoginPage } from '../pages/admin/LoginPage'
import { InstructorDashboardPage } from '../pages/admin/InstructorDashboardPage'
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
            <Route path="/" element={<Navigate to="/instructor" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
                <Route path="/instructor" element={<RequirePermission permission="courses.write"><InstructorDashboardPage /></RequirePermission>} />
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
