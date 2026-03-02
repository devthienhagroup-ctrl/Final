import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage'
import { LoginPage } from '../pages/admin/LoginPage'
import { AdminRbacPage } from '../pages/admin/AdminRbacPage'
import { StudentPortalPage } from '../pages/admin/StudentPortalPage'
import { StudentCourseDetailPage } from '../pages/admin/StudentCourseDetailPage'
import { StudentLessonPlayerPage } from '../pages/admin/StudentLessonPlayerPage'
import AdminSpaPage from '../pages/admin/AdminSpaPage'
import AdminCoursesPage from '../pages/admin/AdminCoursesPage'
import { InstructorDashboardPage } from '../pages/admin/InstructorDashboardPage'

function RequireAuth() {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function RequirePermission({ permission, children }: { permission: string; children: React.ReactElement }) {
  const { can } = useAuth()
  if (!can(permission)) {
    return <div className="p-6 text-red-600 font-semibold">Bạn không có quyền truy cập trang này.</div>
  }
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/orders" element={<RequirePermission permission="orders.read"><AdminOrdersPage /></RequirePermission>} />
        <Route path="/admin/rbac" element={<RequirePermission permission="role.read"><AdminRbacPage /></RequirePermission>} />
        <Route path="/admin/services" element={<RequirePermission permission="spa_services.read"><AdminSpaPage /></RequirePermission>} />
        <Route path="/admin/courses" element={<RequirePermission permission="courses.read"><AdminCoursesPage /></RequirePermission>} />
        <Route path="/student" element={<RequirePermission permission="my_courses.read"><StudentPortalPage /></RequirePermission>} />
        <Route path="/instructor" element={<RequirePermission permission="courses.write"><InstructorDashboardPage /></RequirePermission>} />
        <Route path="/student/courses/:id" element={<RequirePermission permission="my_courses.read"><StudentCourseDetailPage /></RequirePermission>} />
        <Route path="/student/lessons/:id" element={<RequirePermission permission="my_courses.read"><StudentLessonPlayerPage /></RequirePermission>} />
      </Route>

      <Route path="*" element={<div className="p-6">404</div>} />
    </Routes>
  )
}
