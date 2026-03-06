import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  coursePlansApi,
  type CourseListItem,
  type CoursePass,
  type CoursePlan,
  type CoursePlanTag,
  type CoursePlansOverview,
} from './coursePlans.api'
import { getAdminUsers, type AdminUser } from './userManagement.api'
import './AdminSpaPage.css'
import './AdminCoursesPage.css'
import './CoursePlansAdminPage.css'

type TabKey = 'plans' | 'tags' | 'passes' | 'subscribers'
type DrawerKind = 'plan' | 'tag' | 'pass' | 'course-tags' | null
type PassFilterStatus = CoursePass['computedStatus'] | ''

type PlanFormState = {
  code: string
  name: string
  price: string
  durationDays: string
  graceDays: string
  maxUnlocks: string
  maxCoursePrice: string
  isActive: boolean
  excludedTagIds: number[]
}

type TagFormState = {
  code: string
  name: string
}

type PassFormState = {
  userId: string
  planId: string
  purchaseId: string
}

type AdminUsersResponse =
    | AdminUser[]
    | {
  items: AdminUser[]
}

type PlanUsageStats = {
  passCount: number
  activeCount: number
  graceCount: number
  usedQuota: number
  totalQuota: number
  remainingQuota: number
}

type SubscriberSummary = {
  userId: number
  user: AdminUser | undefined
  passCount: number
  activePassCount: number
  gracePassCount: number
  expiredPassCount: number
  canceledPassCount: number
  usedQuota: number
  totalQuota: number
  remainingQuota: number
  latestGraceUntil: string | null
}

const passStatuses: CoursePass['computedStatus'][] = ['ACTIVE', 'GRACE', 'EXPIRED', 'CANCELED']
const pageSizeOptions = [10, 20, 50]

const emptyPlanForm: PlanFormState = {
  code: '',
  name: '',
  price: '0',
  durationDays: '30',
  graceDays: '14',
  maxUnlocks: '50',
  maxCoursePrice: '',
  isActive: true,
  excludedTagIds: [],
}

const emptyTagForm: TagFormState = {
  code: '',
  name: '',
}

const emptyPassForm: PassFormState = {
  userId: '',
  planId: '',
  purchaseId: '',
}

function normalizeUsers(payload: AdminUsersResponse): AdminUser[] {
  return Array.isArray(payload) ? payload : payload.items
}

function toPlanForm(plan: CoursePlan): PlanFormState {
  return {
    code: plan.code,
    name: plan.name,
    price: String(plan.price),
    durationDays: String(plan.durationDays),
    graceDays: String(plan.graceDays),
    maxUnlocks: String(plan.maxUnlocks),
    maxCoursePrice: plan.maxCoursePrice == null ? '' : String(plan.maxCoursePrice),
    isActive: plan.isActive,
    excludedTagIds: [...plan.excludedTagIds],
  }
}

function toTagForm(tag: CoursePlanTag): TagFormState {
  return {
    code: tag.code,
    name: tag.name,
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function formatUserLabel(user: AdminUser | undefined, userId: number) {
  if (!user) return `Người dùng #${userId}`
  if (user.name?.trim()) return `${user.name.trim()} (#${userId})`
  return `${user.email} (#${userId})`
}

function formatCourseLabel(course: CourseListItem) {
  return `#${course.id} - ${course.title}`
}

function statusBadgeClass(status: CoursePass['computedStatus']) {
  switch (status) {
    case 'ACTIVE':
      return 'admin-badge course-pass-status course-pass-status-active'
    case 'GRACE':
      return 'admin-badge course-pass-status course-pass-status-grace'
    case 'EXPIRED':
      return 'admin-badge course-pass-status course-pass-status-expired'
    case 'CANCELED':
      return 'admin-badge course-pass-status course-pass-status-canceled'
    default:
      return 'admin-badge course-pass-status course-pass-status-expired'
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return fallback
}

export function CoursePlansAdminPage() {
  const nav = useNavigate()

  const [tab, setTab] = useState<TabKey>('plans')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Drawer state với hiệu ứng trượt
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerContent, setDrawerContent] = useState<DrawerKind>(null)

  const [overview, setOverview] = useState<CoursePlansOverview | null>(null)
  const [tags, setTags] = useState<CoursePlanTag[]>([])
  const [plans, setPlans] = useState<CoursePlan[]>([])
  const [passes, setPasses] = useState<CoursePass[]>([])
  const [courses, setCourses] = useState<CourseListItem[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])

  const [planSearch, setPlanSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [passSearch, setPassSearch] = useState('')

  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)

  const [tagForm, setTagForm] = useState<TagFormState>(emptyTagForm)
  const [editingTagId, setEditingTagId] = useState<number | null>(null)

  const [passForm, setPassForm] = useState<PassFormState>(emptyPassForm)

  const [passFilterUserId, setPassFilterUserId] = useState('')
  const [passFilterUserKeyword, setPassFilterUserKeyword] = useState('')
  const [passFilterPlanId, setPassFilterPlanId] = useState('')
  const [passFilterStatus, setPassFilterStatus] = useState<PassFilterStatus>('')

  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('')
  const [selectedCourseTagIds, setSelectedCourseTagIds] = useState<number[]>([])
  const [coursePickerQuery, setCoursePickerQuery] = useState('')
  const [isUserFilterDropdownOpen, setIsUserFilterDropdownOpen] = useState(false)
  const [isCoursePickerDropdownOpen, setIsCoursePickerDropdownOpen] = useState(false)

  const [passesPage, setPassesPage] = useState(1)
  const [passesPageSize, setPassesPageSize] = useState(pageSizeOptions[0])
  const [subscribersPage, setSubscribersPage] = useState(1)
  const [subscribersPageSize, setSubscribersPageSize] = useState(pageSizeOptions[0])
  const selectedCourse = useMemo(
      () => courses.find((item) => item.id === Number(selectedCourseId)),
      [courses, selectedCourseId],
  )

  const userMap = useMemo(() => {
    const map = new Map<number, AdminUser>()
    for (const user of users) {
      map.set(user.id, user)
    }
    return map
  }, [users])

  const planUsageMap = useMemo(() => {
    const map = new Map<number, PlanUsageStats>()

    for (const pass of passes) {
      const usedUnlocks = Math.max(0, pass.plan.maxUnlocks - pass.remainingUnlocks)
      const current = map.get(pass.planId) || {
        passCount: 0,
        activeCount: 0,
        graceCount: 0,
        usedQuota: 0,
        totalQuota: 0,
        remainingQuota: 0,
      }

      current.passCount += 1
      if (pass.computedStatus === 'ACTIVE') current.activeCount += 1
      if (pass.computedStatus === 'GRACE') current.graceCount += 1
      current.usedQuota += usedUnlocks
      current.totalQuota += pass.plan.maxUnlocks
      current.remainingQuota += pass.remainingUnlocks

      map.set(pass.planId, current)
    }

    return map
  }, [passes])

  const filteredPlans = useMemo(() => {
    const keyword = planSearch.trim().toLowerCase()
    if (!keyword) return plans
    return plans.filter((plan) => `${plan.code} ${plan.name}`.toLowerCase().includes(keyword))
  }, [planSearch, plans])

  const filteredTags = useMemo(() => {
    const keyword = tagSearch.trim().toLowerCase()
    if (!keyword) return tags
    return tags.filter((tag) => `${tag.code} ${tag.name}`.toLowerCase().includes(keyword))
  }, [tagSearch, tags])

  const filteredCourses = useMemo(() => {
    const keyword = courseSearch.trim().toLowerCase()
    if (!keyword) return courses
    return courses.filter((course) => `${course.id} ${course.title}`.toLowerCase().includes(keyword))
  }, [courseSearch, courses])

  const passFilterUserOptions = useMemo(() => {
    const keyword = passFilterUserKeyword.trim().toLowerCase()
    const source = keyword
        ? users.filter((user) => `${user.id} ${user.name || ''} ${user.email || ''}`.toLowerCase().includes(keyword))
        : users
    return source.slice(0, 10)
  }, [users, passFilterUserKeyword])

  const coursePickerOptions = useMemo(() => {
    const keyword = coursePickerQuery.trim().toLowerCase()
    const source = keyword
        ? courses.filter((course) => `${course.id} ${course.title}`.toLowerCase().includes(keyword))
        : courses
    return source.slice(0, 10)
  }, [courses, coursePickerQuery])

  const filteredPasses = useMemo(() => {
    const userId = Number(passFilterUserId)
    const planId = Number(passFilterPlanId)
    const keyword = passSearch.trim().toLowerCase()

    return passes.filter((pass) => {
      if (Number.isInteger(userId) && userId > 0 && pass.userId !== userId) return false
      if (Number.isInteger(planId) && planId > 0 && pass.planId !== planId) return false
      if (passFilterStatus && pass.computedStatus !== passFilterStatus) return false
      if (!keyword) return true

      const user = userMap.get(pass.userId)
      const text = `${pass.id} ${pass.plan.code} ${pass.plan.name} ${formatUserLabel(user, pass.userId)} ${user?.email || ''}`.toLowerCase()
      return text.includes(keyword)
    })
  }, [passes, passFilterUserId, passFilterPlanId, passFilterStatus, passSearch, userMap])

  const subscriberSummaries = useMemo(() => {
    const map = new Map<number, SubscriberSummary>()

    for (const pass of passes) {
      const usedUnlocks = Math.max(0, pass.plan.maxUnlocks - pass.remainingUnlocks)
      const current = map.get(pass.userId) || {
        userId: pass.userId,
        user: userMap.get(pass.userId),
        passCount: 0,
        activePassCount: 0,
        gracePassCount: 0,
        expiredPassCount: 0,
        canceledPassCount: 0,
        usedQuota: 0,
        totalQuota: 0,
        remainingQuota: 0,
        latestGraceUntil: null,
      }

      current.passCount += 1
      if (pass.computedStatus === 'ACTIVE') current.activePassCount += 1
      if (pass.computedStatus === 'GRACE') current.gracePassCount += 1
      if (pass.computedStatus === 'EXPIRED') current.expiredPassCount += 1
      if (pass.computedStatus === 'CANCELED') current.canceledPassCount += 1
      current.usedQuota += usedUnlocks
      current.totalQuota += pass.plan.maxUnlocks
      current.remainingQuota += pass.remainingUnlocks

      if (!current.latestGraceUntil) {
        current.latestGraceUntil = pass.graceUntil
      } else {
        const currentTime = new Date(current.latestGraceUntil).getTime()
        const passTime = new Date(pass.graceUntil).getTime()
        if (Number.isFinite(passTime) && passTime > currentTime) {
          current.latestGraceUntil = pass.graceUntil
        }
      }

      map.set(pass.userId, current)
    }

    return Array.from(map.values()).sort((a, b) => {
      const activeDelta = b.activePassCount + b.gracePassCount - (a.activePassCount + a.gracePassCount)
      if (activeDelta !== 0) return activeDelta
      if (b.passCount !== a.passCount) return b.passCount - a.passCount
      return b.remainingQuota - a.remainingQuota
    })
  }, [passes, userMap])

  const totalPassPages = Math.max(1, Math.ceil(filteredPasses.length / passesPageSize))
  const safePassPage = Math.min(passesPage, totalPassPages)
  const pagedPasses = useMemo(() => {
    const start = (safePassPage - 1) * passesPageSize
    return filteredPasses.slice(start, start + passesPageSize)
  }, [filteredPasses, safePassPage, passesPageSize])

  const totalSubscriberPages = Math.max(1, Math.ceil(subscriberSummaries.length / subscribersPageSize))
  const safeSubscriberPage = Math.min(subscribersPage, totalSubscriberPages)
  const pagedSubscriberSummaries = useMemo(() => {
    const start = (safeSubscriberPage - 1) * subscribersPageSize
    return subscriberSummaries.slice(start, start + subscribersPageSize)
  }, [subscriberSummaries, safeSubscriberPage, subscribersPageSize])

  const subscribersOverview = useMemo(() => {
    const totals = {
      users: subscriberSummaries.length,
      activeUsers: 0,
      totalQuota: 0,
      usedQuota: 0,
      remainingQuota: 0,
    }

    for (const item of subscriberSummaries) {
      if (item.activePassCount > 0 || item.gracePassCount > 0) {
        totals.activeUsers += 1
      }
      totals.totalQuota += item.totalQuota
      totals.usedQuota += item.usedQuota
      totals.remainingQuota += item.remainingQuota
    }

    return totals
  }, [subscriberSummaries])

  const viewOverview = useMemo(() => {
    if (overview) return overview

    return {
      tagCount: tags.length,
      planCount: plans.length,
      activePlanCount: plans.filter((item) => item.isActive).length,
      passCount: passes.length,
      activePassCount: passes.filter((item) => item.computedStatus === 'ACTIVE').length,
      gracePassCount: passes.filter((item) => item.computedStatus === 'GRACE').length,
      subscriberCount: subscribersOverview.users,
      totalQuota: subscribersOverview.totalQuota,
      usedQuota: subscribersOverview.usedQuota,
      remainingQuota: subscribersOverview.remainingQuota,
    } satisfies CoursePlansOverview
  }, [overview, tags.length, plans, passes, subscribersOverview])

  const drawerTitle = useMemo(() => {
    if (drawerContent === 'plan') return editingPlanId ? `Sửa gói #${editingPlanId}` : 'Tạo gói học mới'
    if (drawerContent === 'tag') return editingTagId ? `Sửa thẻ #${editingTagId}` : 'Tạo thẻ mới'
    if (drawerContent === 'pass') return 'Tạo lượt sử dụng khóa học'
    if (drawerContent === 'course-tags') return 'Gán thẻ cho khóa học'
    return ''
  }, [drawerContent, editingPlanId, editingTagId])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [tagRows, planRows, passRows, courseResp, usersResp, overviewResp] = await Promise.all([
        coursePlansApi.listTags(),
        coursePlansApi.listPlans(),
        coursePlansApi.listPasses(),
        coursePlansApi.listCourses({ page: 1, pageSize: 50 }),
        getAdminUsers({ page: 1, pageSize: 1000 }),
        coursePlansApi.getOverview().catch(() => null),
      ])

      setTags(tagRows)
      setPlans(planRows)
      setPasses(passRows)
      setCourses(courseResp.items)
      setUsers(normalizeUsers(usersResp as AdminUsersResponse))
      setOverview(overviewResp)
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Không thể tải dữ liệu gói học'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (!selectedCourse) {
      setSelectedCourseTagIds([])
      if (drawerContent === 'course-tags') {
        setCoursePickerQuery('')
      }
      return
    }

    const tagIds = (selectedCourse.tagLinks || []).map((row) => row.tagId)
    setSelectedCourseTagIds(tagIds)
    if (drawerContent === 'course-tags') {
      setCoursePickerQuery(formatCourseLabel(selectedCourse))
    }
  }, [selectedCourse, drawerContent])

  useEffect(() => {
    if (!passFilterUserId) {
      setPassFilterUserKeyword('')
      return
    }

    const userId = Number(passFilterUserId)
    if (!Number.isInteger(userId) || userId <= 0) return
    setPassFilterUserKeyword(formatUserLabel(userMap.get(userId), userId))
  }, [passFilterUserId, userMap])

  useEffect(() => {
    setPassesPage(1)
  }, [passSearch, passFilterUserId, passFilterPlanId, passFilterStatus, passesPageSize])

  useEffect(() => {
    setSubscribersPage(1)
  }, [subscribersPageSize, subscriberSummaries.length])

  // Các hàm mở drawer – set nội dung và mở
  function openPlanDrawer(plan?: CoursePlan) {
    if (plan) {
      setEditingPlanId(plan.id)
      setPlanForm(toPlanForm(plan))
    } else {
      setEditingPlanId(null)
      setPlanForm(emptyPlanForm)
    }
    setDrawerContent('plan')
    setIsDrawerOpen(true)
  }

  function openTagDrawer(tag?: CoursePlanTag) {
    if (tag) {
      setEditingTagId(tag.id)
      setTagForm(toTagForm(tag))
    } else {
      setEditingTagId(null)
      setTagForm(emptyTagForm)
    }
    setDrawerContent('tag')
    setIsDrawerOpen(true)
  }

  function openPassDrawer(userId?: number) {
    setPassForm({
      userId: userId ? String(userId) : '',
      planId: '',
      purchaseId: '',
    })
    setDrawerContent('pass')
    setIsDrawerOpen(true)
  }

  function openCourseTagsDrawer(courseId?: number) {
    if (typeof courseId === 'number') {
      setSelectedCourseId(courseId)
    } else {
      setSelectedCourseId('')
      setCoursePickerQuery('')
    }
    setDrawerContent('course-tags')
    setIsDrawerOpen(true)
  }

  // Đóng drawer với hiệu ứng
  function closeDrawer() {
    setIsDrawerOpen(false)
    setIsCoursePickerDropdownOpen(false)
    setIsUserFilterDropdownOpen(false)
    setTimeout(() => {
      setDrawerContent(null)
      // Không reset form ở đây vì mỗi lần mở đều set form mới
    }, 300)
  }

  function clearPassFilters() {
    setPassFilterUserId('')
    setPassFilterUserKeyword('')
    setPassFilterPlanId('')
    setPassFilterStatus('')
    setPassSearch('')
    setPassesPage(1)
  }

  async function onSavePlan(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!planForm.code.trim() || !planForm.name.trim()) {
      setError('Mã gói và tên gói là bắt buộc')
      return
    }

    const price = Number(planForm.price)
    const durationDays = Number(planForm.durationDays)
    const graceDays = Number(planForm.graceDays)
    const maxUnlocks = Number(planForm.maxUnlocks)
    const maxCoursePrice = planForm.maxCoursePrice.trim() ? Number(planForm.maxCoursePrice) : null

    if (!Number.isFinite(price) || price < 0) {
      setError('Giá phải là số >= 0')
      return
    }

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      setError('Thời hạn phải > 0')
      return
    }

    if (!Number.isFinite(graceDays) || graceDays < 0) {
      setError('Số ngày gia hạn phải >= 0')
      return
    }

    if (!Number.isFinite(maxUnlocks) || maxUnlocks < 1) {
      setError('Số lượt mở tối đa phải >= 1')
      return
    }

    if (maxCoursePrice !== null && (!Number.isFinite(maxCoursePrice) || maxCoursePrice < 0)) {
      setError('Giá tối đa khóa học phải là số >= 0 hoặc để trống')
      return
    }

    const payload = {
      code: planForm.code.trim().toUpperCase(),
      name: planForm.name.trim(),
      price,
      durationDays,
      graceDays,
      maxUnlocks,
      maxCoursePrice,
      isActive: planForm.isActive,
      excludedTagIds: Array.from(new Set(planForm.excludedTagIds)),
    }

    try {
      if (editingPlanId) {
        await coursePlansApi.updatePlan(editingPlanId, payload)
        setMessage(`Đã cập nhật gói #${editingPlanId}`)
      } else {
        await coursePlansApi.createPlan(payload)
        setMessage('Đã tạo gói học')
      }

      closeDrawer()
      setEditingPlanId(null)
      setPlanForm(emptyPlanForm)
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  async function onSaveTag(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!tagForm.code.trim() || !tagForm.name.trim()) {
      setError('Mã thẻ và tên thẻ là bắt buộc')
      return
    }

    const payload = {
      code: tagForm.code.trim().toUpperCase(),
      name: tagForm.name.trim(),
    }

    try {
      if (editingTagId) {
        await coursePlansApi.updateTag(editingTagId, payload)
        setMessage(`Đã cập nhật thẻ #${editingTagId}`)
      } else {
        await coursePlansApi.createTag(payload)
        setMessage('Đã tạo thẻ')
      }

      closeDrawer()
      setEditingTagId(null)
      setTagForm(emptyTagForm)
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  async function onDeleteTag(tag: CoursePlanTag) {
    if (!window.confirm(`Xóa thẻ ${tag.code}?`)) return

    try {
      await coursePlansApi.deleteTag(tag.id)
      setMessage('Đã xóa thẻ')
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  async function onSaveCourseTags(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!selectedCourseId) {
      setError('Vui lòng chọn khóa học')
      return
    }

    try {
      await coursePlansApi.setCourseTags(Number(selectedCourseId), selectedCourseTagIds)
      setMessage('Đã lưu thẻ cho khóa học')
      closeDrawer()
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  async function onTogglePlan(plan: CoursePlan) {
    try {
      await coursePlansApi.updatePlan(plan.id, { isActive: !plan.isActive })
      setMessage(`Gói ${plan.code} ${plan.isActive ? 'đã vô hiệu' : 'đã kích hoạt'}`)
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  async function onDeletePlan(plan: CoursePlan) {
    if (!window.confirm(`Xóa gói ${plan.code}?`)) return

    try {
      await coursePlansApi.deletePlan(plan.id)
      setMessage('Đã xóa gói')
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  async function onCreatePass(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const userId = Number(passForm.userId)
    const planId = Number(passForm.planId)

    if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(planId) || planId <= 0) {
      setError('ID người dùng và gói là bắt buộc')
      return
    }

    let purchaseId: number | undefined
    if (passForm.purchaseId.trim()) {
      const parsed = Number(passForm.purchaseId)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setError('ID mua hàng phải là số nguyên dương hoặc để trống')
        return
      }
      purchaseId = parsed
    }

    try {
      await coursePlansApi.createPass({
        userId,
        planId,
        ...(purchaseId ? { purchaseId } : {}),
      })
      setPassForm(emptyPassForm)
      closeDrawer()
      setMessage(`Đã tạo lượt sử dụng cho người dùng #${userId}`)
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  async function onRenewPass(pass: CoursePass) {
    try {
      await coursePlansApi.renewPass(pass.id)
      setMessage(`Đã gia hạn lượt #${pass.id}`)
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  async function onCancelPass(pass: CoursePass) {
    if (!window.confirm(`Hủy lượt #${pass.id}?`)) return

    try {
      await coursePlansApi.cancelPass(pass.id)
      setMessage(`Đã hủy lượt #${pass.id}`)
      await loadData()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Yêu cầu thất bại'))
    }
  }

  function onViewSubscriberPasses(userId: number) {
    setPassFilterUserId(String(userId))
    setPassesPage(1)
    setTab('passes')
  }

  return (
      <main className="admin-page admin-courses-theme course-plans-admin">
        <section className="admin-header course-plans-header">
          <div className="left-header flex-1">
            <p className="admin-header-kicker">
              <i className="fa-solid fa-layer-group" /> QUẢN LÝ GÓI HỌC
            </p>
            <h1>Quản lý các gói học, thẻ, lượt sử dụng và người đăng ký</h1>
            <p>
              Không gian quản trị hiện đại với các drawer bên phải cho luồng tạo/sửa. Bảng tập trung trong khi form chỉ hiển thị khi cần.
            </p>
          </div>

          <div className="course-plans-header-actions">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => void loadData()}>
              <i className="fa-solid fa-rotate" /> Làm mới
            </button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => nav('/admin/dashboard')}>
              <i className="fa-solid fa-gauge" /> Về bảng điều khiển
            </button>
          </div>
        </section>

        <section className="admin-overview course-plans-overview">
          <article className="overview-card">
          <span>
            <i className="fa-solid fa-boxes-stacked" /> Gói học
          </span>
            <strong>{viewOverview.planCount}</strong>
            <small>{viewOverview.activePlanCount} gói đang kích hoạt</small>
          </article>
          <article className="overview-card">
          <span>
            <i className="fa-solid fa-tags" /> Thẻ khóa học
          </span>
            <strong>{viewOverview.tagCount}</strong>
            <small>Nhãn dùng để lọc và giới hạn</small>
          </article>
          <article className="overview-card">
          <span>
            <i className="fa-solid fa-ticket" /> Lượt sử dụng
          </span>
            <strong>{viewOverview.passCount}</strong>
            <small>
              {viewOverview.activePassCount} đang dùng | {viewOverview.gracePassCount} gia hạn
            </small>
          </article>
          <article className="overview-card">
          <span>
            <i className="fa-solid fa-users" /> Người đăng ký
          </span>
            <strong>{viewOverview.subscriberCount}</strong>
            <small>Người dùng có sử dụng gói</small>
          </article>
          <article className="overview-card">
          <span>
            <i className="fa-solid fa-chart-column" /> Hạn mức
          </span>
            <strong>{viewOverview.usedQuota}</strong>
            <small>
              Đã dùng / {viewOverview.totalQuota} tổng (còn {viewOverview.remainingQuota})
            </small>
          </article>
        </section>

        <section className="admin-tabs">
          <button className={`admin-tab ${tab === 'plans' ? 'active' : ''}`} type="button" onClick={() => setTab('plans')}>
            <i className="fa-solid fa-cubes" /> Gói học
          </button>
          <button className={`admin-tab ${tab === 'tags' ? 'active' : ''}`} type="button" onClick={() => setTab('tags')}>
            <i className="fa-solid fa-tags" /> Thẻ
          </button>
          <button className={`admin-tab ${tab === 'passes' ? 'active' : ''}`} type="button" onClick={() => setTab('passes')}>
            <i className="fa-solid fa-ticket" /> Lượt sử dụng
          </button>
          <button
              className={`admin-tab ${tab === 'subscribers' ? 'active' : ''}`}
              type="button"
              onClick={() => setTab('subscribers')}
          >
            <i className="fa-solid fa-user-group" /> Người đăng ký
          </button>
        </section>

        {loading ? (
            <div className="admin-card course-plans-banner">
              <i className="fa-solid fa-spinner fa-spin" /> Đang tải dữ liệu...
            </div>
        ) : null}

        {message ? (
            <div className="admin-card course-plans-banner course-plans-banner-success">
              <i className="fa-solid fa-circle-check" /> {message}
            </div>
        ) : null}

        {error ? (
            <div className="admin-card course-plans-banner course-plans-banner-error">
              <i className="fa-solid fa-triangle-exclamation" /> {error}
            </div>
        ) : null}

        {tab === 'plans' ? (
            <section className="admin-card admin-card-glow">
              <div className="admin-row admin-row-between course-plans-toolbar !items-end">
                <div className="admin-field course-plans-search-field">
                  <label className="admin-label">
                    <i className="fa-solid fa-magnifying-glass" /> Tìm gói học
                  </label>
                  <input
                      className="admin-input"
                      placeholder="Tìm theo mã hoặc tên gói..."
                      value={planSearch}
                      onChange={(e) => setPlanSearch(e.target.value)}
                  />
                </div>
                <button type="button" className="admin-btn admin-btn-primary" onClick={() => openPlanDrawer()}>
                  <i className="fa-solid fa-plus" /> Tạo gói học
                </button>
              </div>

              <div className="admin-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="admin-table">
                  <thead>
                  <tr>
                    <th>Gói</th>
                    <th>Thời hạn</th>
                    <th>Giá</th>
                    <th>Hạn mức</th>
                    <th>Trạng thái</th>
                    <th>Sử dụng</th>
                    <th>Thao tác</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filteredPlans.map((plan) => {
                    const stats = planUsageMap.get(plan.id)
                    return (
                        <tr key={plan.id}>
                          <td>
                            <div className="td-strong">{plan.code}</div>
                            <div className="course-plans-muted">{plan.name}</div>
                            <div className="course-plans-muted">
                              Thẻ bị loại trừ: {plan.excludedTags.length ? plan.excludedTags.map((item) => item.code).join(', ') : 'Không'}
                            </div>
                          </td>
                          <td>
                            <div>{plan.durationDays} ngày</div>
                            <div className="course-plans-muted">Gia hạn: {plan.graceDays} ngày</div>
                          </td>
                          <td>
                            <div>{plan.price.toLocaleString('vi-VN')} VNĐ</div>
                            <div className="course-plans-muted">
                              Giá tối đa khóa học: {plan.maxCoursePrice == null ? 'Không giới hạn' : `${plan.maxCoursePrice.toLocaleString('vi-VN')} VNĐ`}
                            </div>
                          </td>
                          <td>
                            <div>{plan.maxUnlocks} lượt mở</div>
                            <div className="course-plans-muted">Còn lại: {stats?.remainingQuota || 0}</div>
                          </td>
                          <td>
                        <span className={`admin-badge ${plan.isActive ? 'admin-badge-green' : 'admin-badge-red'}`}>
                          {plan.isActive ? 'ĐANG KÍCH HOẠT' : 'ĐÃ VÔ HIỆU'}
                        </span>
                          </td>
                          <td>
                            <div>Lượt: {stats?.passCount || 0}</div>
                            <div className="course-plans-muted">Đang dùng/Gia hạn: {stats?.activeCount || 0}/{stats?.graceCount || 0}</div>
                            <div className="course-plans-muted">Đã dùng: {stats?.usedQuota || 0} / {stats?.totalQuota || 0}</div>
                          </td>
                          <td>
                            <div className="admin-action-row">
                              <button
                                  type="button"
                                  className="admin-btn-icon admin-btn-icon-edit"
                                  title="Sửa gói"
                                  onClick={() => openPlanDrawer(plan)}
                              >
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button
                                  type="button"
                                  className="admin-btn-icon admin-btn-icon-info"
                                  title={plan.isActive ? 'Vô hiệu gói' : 'Kích hoạt gói'}
                                  onClick={() => void onTogglePlan(plan)}
                              >
                                <i className={`fa-solid ${plan.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} />
                              </button>
                              <button
                                  type="button"
                                  className="admin-btn-icon admin-btn-icon-delete"
                                  title="Xóa gói"
                                  onClick={() => void onDeletePlan(plan)}
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                    )
                  })}

                  {filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="course-plans-empty-row">Không tìm thấy gói học.</td>
                      </tr>
                  ) : null}
                  </tbody>
                </table>
              </div>
            </section>
        ) : null}

        {tab === 'tags' ? (
            <section className="course-plans-grid">
              <article className="admin-card admin-card-glow">
                <div className="admin-row admin-row-between course-plans-toolbar !items-end">
                  <div className="admin-field course-plans-search-field">
                    <label className="admin-label">
                      <i className="fa-solid fa-magnifying-glass" /> Tìm thẻ
                    </label>
                    <input
                        className="admin-input"
                        placeholder="Tìm theo mã hoặc tên thẻ..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                    />
                  </div>
                  <button type="button" className="admin-btn admin-btn-primary" onClick={() => openTagDrawer()}>
                    <i className="fa-solid fa-plus" /> Tạo thẻ
                  </button>
                </div>

                <div className="admin-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="admin-table">
                    <thead>
                    <tr>
                      <th>Tháº»</th>
                      <th>Sử dụng</th>
                      <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredTags.map((tag) => (
                        <tr key={tag.id}>
                          <td>
                            <div className="td-strong">{tag.code}</div>
                            <div className="course-plans-muted">{tag.name}</div>
                          </td>
                          <td>
                            <div>Khóa học: {tag._count?.courseLinks || 0}</div>
                            <div className="course-plans-muted">Bị loại trừ trong gói: {tag._count?.excludedInPlans || 0}</div>
                          </td>
                          <td>
                            <div className="admin-action-row">
                              <button
                                  type="button"
                                  className="admin-btn-icon admin-btn-icon-edit"
                                  title="Sửa thẻ"
                                  onClick={() => openTagDrawer(tag)}
                              >
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button
                                  type="button"
                                  className="admin-btn-icon admin-btn-icon-delete"
                                  title="Xóa thẻ"
                                  onClick={() => void onDeleteTag(tag)}
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}

                    {filteredTags.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="course-plans-empty-row">Không tìm thấy thẻ.</td>
                        </tr>
                    ) : null}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="admin-card admin-card-glow">
                <div className="admin-row admin-row-between course-plans-toolbar !items-end">
                  <div className="admin-field course-plans-search-field">
                    <label className="admin-label">
                      <i className="fa-solid fa-book" /> Tìm khóa học
                    </label>
                    <input
                        className="admin-input"
                        placeholder="Tìm theo tiêu đề khóa học..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                    />
                  </div>
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => openCourseTagsDrawer()}>
                    <i className="fa-solid fa-link" /> Gán thẻ
                  </button>
                </div>

                <div className="admin-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="admin-table">
                    <thead>
                    <tr>
                      <th>Khóa học</th>
                      <th>Thẻ hiện tại</th>
                      <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredCourses.map((course) => (
                        <tr key={course.id}>
                          <td>
                            <div className="td-strong">#{course.id}</div>
                            <div className="course-plans-muted">{course.title}</div>
                          </td>
                          <td>
                            {course.tagLinks?.length ? (
                                <div className="admin-badge-wrap">
                                  {course.tagLinks.slice(0, 4).map((row) => (
                                      <span className="admin-badge admin-badge-blue" key={row.tagId}>
                                {row.tag.code}
                              </span>
                                  ))}
                                  {course.tagLinks.length > 4 ? (
                                      <span className="admin-badge admin-badge-blue">+{course.tagLinks.length - 4}</span>
                                  ) : null}
                                </div>
                            ) : (
                                <span className="course-plans-muted">Không có thẻ</span>
                            )}
                          </td>
                          <td>
                            <button
                                type="button"
                                className="admin-btn admin-btn-ghost"
                                onClick={() => openCourseTagsDrawer(course.id)}
                            >
                              <i className="fa-solid fa-pen-to-square" /> Sửa thẻ
                            </button>
                          </td>
                        </tr>
                    ))}

                    {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="course-plans-empty-row">Không tìm thấy khóa học.</td>
                        </tr>
                    ) : null}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
        ) : null}

        {tab === 'passes' ? (
            <section className="course-plans-grid-single">
              <article className="admin-card admin-card-glow">
                <div className="course-plans-filter-grid">
                  <div className="admin-field">
                    <label className="admin-label">
                      <i className="fa-solid fa-magnifying-glass" /> Tìm lượt sử dụng
                    </label>
                    <input
                        className="admin-input"
                        placeholder="Tìm theo lượt/người dùng/gói..."
                        value={passSearch}
                        onChange={(e) => setPassSearch(e.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">
                      <i className="fa-solid fa-user" /> Lọc theo người dùng
                    </label>
                    <div
                        style={{ position: 'relative' }}
                        onFocus={() => setIsUserFilterDropdownOpen(true)}
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                            setIsUserFilterDropdownOpen(false)
                          }
                        }}
                    >
                      <input
                          className="admin-input"
                          placeholder="Nhập ID / tên / email người dùng"
                          value={passFilterUserKeyword}
                          onFocus={() => setIsUserFilterDropdownOpen(true)}
                          onChange={(e) => {
                            const keyword = e.target.value
                            setPassFilterUserKeyword(keyword)
                            setIsUserFilterDropdownOpen(true)
                            if (!keyword.trim()) {
                              setPassFilterUserId('')
                            }
                          }}
                      />
                      {isUserFilterDropdownOpen ? (
                          <div
                              className="course-plans-picker-list"
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                left: 0,
                                right: 0,
                                zIndex: 30,
                                maxHeight: 280,
                                overflowY: 'auto',
                              }}
                          >
                            <button
                                type="button"
                                className={`course-plans-picker-option ${passFilterUserId === '' ? 'active' : ''}`}
                                onClick={() => {
                                  setPassFilterUserId('')
                                  setPassFilterUserKeyword('')
                                  setIsUserFilterDropdownOpen(false)
                                }}
                            >
                              Tất cả người dùng
                            </button>
                            {passFilterUserOptions.map((user) => {
                              const selected = passFilterUserId === String(user.id)
                              return (
                                  <button
                                      key={user.id}
                                      type="button"
                                      className={`course-plans-picker-option ${selected ? 'active' : ''}`}
                                      onClick={() => {
                                        setPassFilterUserId(String(user.id))
                                        setPassFilterUserKeyword(formatUserLabel(user, user.id))
                                        setIsUserFilterDropdownOpen(false)
                                      }}
                                  >
                                    <span className="course-plans-picker-title">{formatUserLabel(user, user.id)}</span>
                                    <span className="course-plans-muted">{user.email}</span>
                                  </button>
                              )
                            })}
                            {passFilterUserOptions.length === 0 ? <div className="course-plans-picker-empty">Không tìm thấy người dùng.</div> : null}
                          </div>
                      ) : null}
                    </div>
                    {/*<p className="admin-helper">Focus vào ô để mở danh sách gợi ý.</p>*/}
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">
                      <i className="fa-solid fa-cube" /> Lọc theo gói
                    </label>
                    <select className="admin-input" value={passFilterPlanId} onChange={(e) => setPassFilterPlanId(e.target.value)}>
                      <option value="">Tất cả gói</option>
                      {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>{plan.code} ({plan.name})</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">
                      <i className="fa-solid fa-signal" /> Lọc theo trạng thái
                    </label>
                    <select
                        className="admin-input"
                        value={passFilterStatus}
                        onChange={(e) => setPassFilterStatus(e.target.value as PassFilterStatus)}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {passStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-row admin-row-between mb-2">
                  <div className="course-plans-muted">Hiển thị {filteredPasses.length === 0 ? 0 : (safePassPage - 1) * passesPageSize + 1}-{Math.min(safePassPage * passesPageSize, filteredPasses.length)} / {filteredPasses.length} lượt</div>
                  <div className="admin-row">
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={clearPassFilters}>
                      <i className="fa-solid fa-filter-circle-xmark" /> Xóa bộ lọc
                    </button>
                    <button type="button" className="admin-btn admin-btn-primary" onClick={() => openPassDrawer()}>
                      <i className="fa-solid fa-plus" /> Tạo lượt sử dụng
                    </button>
                  </div>
                </div>

                <div className="admin-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="admin-table">
                    <thead>
                    <tr>
                      <th>Lượt</th>
                      <th>Người dùng</th>
                      <th>Gói</th>
                      <th>Trạng thái</th>
                      <th>Hạn mức</th>
                      <th>Dòng thời gian</th>
                      <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pagedPasses.map((pass) => {
                      const user = userMap.get(pass.userId)
                      const usedUnlocks = Math.max(0, pass.plan.maxUnlocks - pass.remainingUnlocks)

                      return (
                          <tr key={pass.id}>
                            <td>
                              <div className="td-strong">#{pass.id}</div>
                              <div className="course-plans-muted">Mua hàng: {pass.purchaseId || '-'}</div>
                            </td>
                            <td>
                              <div className="td-strong">{formatUserLabel(user, pass.userId)}</div>
                              <div className="course-plans-muted">{user?.email || `id: ${pass.userId}`}</div>
                            </td>
                            <td>
                              <div className="td-strong">{pass.plan.code}</div>
                              <div className="course-plans-muted">{pass.plan.name}</div>
                            </td>
                            <td>
                              <span className={statusBadgeClass(pass.computedStatus)}>{pass.computedStatus}</span>
                            </td>
                            <td>
                              <div>{pass.remainingUnlocks} / {pass.plan.maxUnlocks} </div>
                              <div className="course-plans-muted">Đã dùng: {usedUnlocks}</div>
                            </td>
                            <td>
                              <div className="course-plans-muted">Bắt đầu: {formatDateTime(pass.startAt)}</div>
                              <div className="course-plans-muted">Kết thúc: {formatDateTime(pass.endAt)}</div>
                              <div className="course-plans-muted">Gia hạn: {formatDateTime(pass.graceUntil)}</div>
                            </td>
                            <td>
                              <div className="admin-row">
                                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => void onRenewPass(pass)}>
                                  <i className="fa-solid fa-rotate-right" /> Gia háº¡n
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-danger"
                                    onClick={() => void onCancelPass(pass)}
                                    disabled={pass.computedStatus === 'CANCELED'}
                                >
                                  <i className="fa-solid fa-ban" /> Hủy
                                </button>
                              </div>
                            </td>
                          </tr>
                      )
                    })}

                    {filteredPasses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="course-plans-empty-row">Không tìm thấy lượt sử dụng.</td>
                        </tr>
                    ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="course-plans-pagination">
                  <div className="admin-row">
                    <span className="admin-helper">Mỗi trang</span>
                    <select className="admin-input admin-input-sm" value={passesPageSize} onChange={(e) => setPassesPageSize(Number(e.target.value))}>
                      {pageSizeOptions.map((size) => (
                          <option key={`pass-page-size-${size}`} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-row">
                    <button type="button" className="admin-btn admin-btn-ghost" disabled={safePassPage <= 1} onClick={() => setPassesPage(safePassPage - 1)}>Trước</button>
                    <span className="admin-helper">Trang {safePassPage}/{totalPassPages}</span>
                    <button type="button" className="admin-btn admin-btn-ghost" disabled={safePassPage >= totalPassPages} onClick={() => setPassesPage(safePassPage + 1)}>Sau</button>
                  </div>
                </div>
              </article>
            </section>
        ) : null}

        {tab === 'subscribers' ? (
            <section className="course-plans-grid-single">
              <article className="admin-card admin-card-glow">
                <div className="course-plans-sub-overview">
                  <div className="course-plans-mini-stat"><span>Người đăng ký</span><strong>{subscribersOverview.users}</strong></div>
                  <div className="course-plans-mini-stat"><span>Người dùng đang dùng / gia hạn</span><strong>{subscribersOverview.activeUsers}</strong></div>
                  <div className="course-plans-mini-stat"><span>Hạn mức đã dùng</span><strong>{subscribersOverview.usedQuota}</strong></div>
                  <div className="course-plans-mini-stat"><span>Hạn mức còn lại</span><strong>{subscribersOverview.remainingQuota}</strong></div>
                </div>

                <div className="admin-row admin-row-between mb-2">
                  <div className="course-plans-muted">Hiển thị {subscriberSummaries.length === 0 ? 0 : (safeSubscriberPage - 1) * subscribersPageSize + 1}-{Math.min(safeSubscriberPage * subscribersPageSize, subscriberSummaries.length)} / {subscriberSummaries.length} người dùng</div>
                </div>

                <div className="admin-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="admin-table">
                    <thead>
                    <tr>
                      <th>Người dùng</th>
                      <th>Lượt</th>
                      <th>Phân loại trạng thái</th>
                      <th>Hạn mức</th>
                      <th>Gia háº¡n gáº§n nháº¥t</th>
                      <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pagedSubscriberSummaries.map((item) => (
                        <tr key={item.userId}>
                          <td>
                            <div className="td-strong">{formatUserLabel(item.user, item.userId)}</div>
                            <div className="course-plans-muted">{item.user?.email || `id: ${item.userId}`}</div>
                          </td>
                          <td>{item.passCount}</td>
                          <td>
                            <div className="course-plans-muted">ĐANG DÙNG: {item.activePassCount}</div>
                            <div className="course-plans-muted">GIA Háº N: {item.gracePassCount}</div>
                            <div className="course-plans-muted">Háº¾T Háº N: {item.expiredPassCount}</div>
                            <div className="course-plans-muted">ĐÃ HỦY: {item.canceledPassCount}</div>
                          </td>
                          <td>
                            <div className="course-plans-muted">Đã dùng: {item.usedQuota}</div>
                            <div className="course-plans-muted">Tổng: {item.totalQuota}</div>
                            <div className="course-plans-muted">Còn lại: {item.remainingQuota}</div>
                          </td>
                          <td>{formatDateTime(item.latestGraceUntil)}</td>
                          <td>
                            <div className="admin-row">
                              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onViewSubscriberPasses(item.userId)}>
                                <i className="fa-solid fa-list" /> Xem lượt
                              </button>
                              <button type="button" className="admin-btn admin-btn-primary" onClick={() => openPassDrawer(item.userId)}>
                                <i className="fa-solid fa-plus" /> Tạo lượt
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}

                    {subscriberSummaries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="course-plans-empty-row">Chưa có người đăng ký.</td>
                        </tr>
                    ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="course-plans-pagination">
                  <div className="admin-row">
                    <span className="admin-helper">Mỗi trang</span>
                    <select className="admin-input admin-input-sm" value={subscribersPageSize} onChange={(e) => setSubscribersPageSize(Number(e.target.value))}>
                      {pageSizeOptions.map((size) => (
                          <option key={`subscriber-page-size-${size}`} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-row">
                    <button type="button" className="admin-btn admin-btn-ghost" disabled={safeSubscriberPage <= 1} onClick={() => setSubscribersPage(safeSubscriberPage - 1)}>Trước</button>
                    <span className="admin-helper">Trang {safeSubscriberPage}/{totalSubscriberPages}</span>
                    <button type="button" className="admin-btn admin-btn-ghost" disabled={safeSubscriberPage >= totalSubscriberPages} onClick={() => setSubscribersPage(safeSubscriberPage + 1)}>Sau</button>
                  </div>
                </div>
              </article>
            </section>
        ) : null}

        {/* Drawer với hiệu ứng trượt */}
        {drawerContent && (
            <div
                className="course-plans-drawer-backdrop"
                onClick={closeDrawer}
                style={{
                  opacity: isDrawerOpen ? 1 : 0,
                  pointerEvents: isDrawerOpen ? 'auto' : 'none',
                  transition: 'opacity 0.3s ease',
                }}
            >
              <aside
                  className="course-plans-drawer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s ease-out',
                  }}
              >
                <header className="course-plans-drawer-header">
                  <div>
                    <p className="course-plans-drawer-kicker">Quản trị gói học</p>
                    <h3>{drawerTitle}</h3>
                  </div>
                  <button type="button" className="admin-btn admin-btn-ghost course-plans-close-btn" onClick={closeDrawer}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </header>

                {drawerContent === 'plan' ? (
                    <form onSubmit={onSavePlan} className="admin-form-grid course-plans-form-grid">
                      <div className="admin-field">
                        <label className="admin-label">Mã gói</label>
                        <input className="admin-input" placeholder="Ví dụ: LV1" value={planForm.code} onChange={(e) => setPlanForm((prev) => ({ ...prev, code: e.target.value }))} />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Tên gói</label>
                        <input className="admin-input" placeholder="Tên gói" value={planForm.name} onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))} />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Giá (VNĐ)</label>
                        <input className="admin-input" placeholder="0" value={planForm.price} onChange={(e) => setPlanForm((prev) => ({ ...prev, price: e.target.value }))} />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Số lượt mở tối đa</label>
                        <input className="admin-input" placeholder="50" value={planForm.maxUnlocks} onChange={(e) => setPlanForm((prev) => ({ ...prev, maxUnlocks: e.target.value }))} />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Thời hạn (ngày)</label>
                        <input className="admin-input" placeholder="30" value={planForm.durationDays} onChange={(e) => setPlanForm((prev) => ({ ...prev, durationDays: e.target.value }))} />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Số ngày gia hạn</label>
                        <input className="admin-input" placeholder="14" value={planForm.graceDays} onChange={(e) => setPlanForm((prev) => ({ ...prev, graceDays: e.target.value }))} />
                      </div>
                      <div className="admin-field admin-field-full">
                        <label className="admin-label">Giá tối đa khóa học (không bắt buộc)</label>
                        <input className="admin-input" placeholder="Để trống nếu không giới hạn" value={planForm.maxCoursePrice} onChange={(e) => setPlanForm((prev) => ({ ...prev, maxCoursePrice: e.target.value }))} />
                      </div>
                      <label className="admin-checkbox admin-field-full">
                        <input type="checkbox" checked={planForm.isActive} onChange={(e) => setPlanForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
                        <span className="admin-checkbox-slider" />
                        <span className="admin-checkbox-label">Gói đang kích hoạt</span>
                      </label>
                      <div className="admin-field admin-field-full">
                        <label className="admin-label">Thẻ bị loại trừ</label>
                        <div className="admin-multi-select">
                          {tags.map((tag) => {
                            const checked = planForm.excludedTagIds.includes(tag.id)
                            return (
                                <label key={tag.id} className="admin-checkbox-row">
                                  <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => setPlanForm((prev) => ({
                                        ...prev,
                                        excludedTagIds: e.target.checked ? Array.from(new Set([...prev.excludedTagIds, tag.id])) : prev.excludedTagIds.filter((id) => id !== tag.id),
                                      }))}
                                  />
                                  <span>{tag.code} - {tag.name}</span>
                                </label>
                            )
                          })}
                        </div>
                      </div>
                      <div className="admin-row">
                        <button type="submit" className="admin-btn admin-btn-save"><i className="fa-solid fa-floppy-disk" /> {editingPlanId ? 'Lưu thay đổi' : 'Tạo gói'}</button>
                        <button type="button" className="admin-btn admin-btn-ghost" onClick={closeDrawer}><i className="fa-solid fa-xmark" /> Hủy</button>
                      </div>
                    </form>
                ) : null}

                {drawerContent === 'tag' ? (
                    <form onSubmit={onSaveTag} className="admin-form-grid">
                      <div className="admin-field">
                        <label className="admin-label">Mã thẻ</label>
                        <input className="admin-input" placeholder="Ví dụ: BEGINNER" value={tagForm.code} onChange={(e) => setTagForm((prev) => ({ ...prev, code: e.target.value }))} />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Tên thẻ</label>
                        <input className="admin-input" placeholder="Tên hiển thị của thẻ" value={tagForm.name} onChange={(e) => setTagForm((prev) => ({ ...prev, name: e.target.value }))} />
                      </div>
                      <div className="admin-row">
                        <button type="submit" className="admin-btn admin-btn-save"><i className="fa-solid fa-floppy-disk" /> {editingTagId ? 'Lưu thay đổi' : 'Tạo thẻ'}</button>
                        <button type="button" className="admin-btn admin-btn-ghost" onClick={closeDrawer}><i className="fa-solid fa-xmark" /> Hủy</button>
                      </div>
                    </form>
                ) : null}

                {drawerContent === 'pass' ? (
                    <form onSubmit={onCreatePass} className="admin-form-grid">
                      <div className="admin-field">
                        <label className="admin-label">ID người dùng</label>
                        <input list="course-plan-users" className="admin-input" placeholder="ID người dùng" value={passForm.userId} onChange={(e) => setPassForm((prev) => ({ ...prev, userId: e.target.value }))} />
                        <datalist id="course-plan-users">
                          {users.map((user) => (
                              <option key={user.id} value={user.id}>{formatUserLabel(user, user.id)}</option>
                          ))}
                        </datalist>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Gói</label>
                        <select className="admin-input" value={passForm.planId} onChange={(e) => setPassForm((prev) => ({ ...prev, planId: e.target.value }))}>
                          <option value="">Chọn gói</option>
                          {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>{plan.id} - {plan.code} ({plan.name})</option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">ID mua hàng (không bắt buộc)</label>
                        <input className="admin-input" placeholder="Không bắt buộc" value={passForm.purchaseId} onChange={(e) => setPassForm((prev) => ({ ...prev, purchaseId: e.target.value }))} />
                      </div>

                      <div className="admin-row">
                        <button type="submit" className="admin-btn admin-btn-save"><i className="fa-solid fa-plus" /> Tạo lượt</button>
                        <button type="button" className="admin-btn admin-btn-ghost" onClick={closeDrawer}><i className="fa-solid fa-xmark" /> Hủy</button>
                      </div>
                    </form>
                ) : null}

                {drawerContent === 'course-tags' ? (
                    <form onSubmit={onSaveCourseTags} className="admin-form-grid">
                      <div className="admin-field">
                        <label className="admin-label">Khóa học</label>
                        <div
                            style={{ position: 'relative' }}
                            onFocus={() => setIsCoursePickerDropdownOpen(true)}
                            onBlur={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                setIsCoursePickerDropdownOpen(false)
                              }
                            }}
                        >
                          <input
                              className="admin-input"
                              placeholder="Nhập ID / tiêu đề khóa học"
                              value={coursePickerQuery}
                              onFocus={() => setIsCoursePickerDropdownOpen(true)}
                              onChange={(e) => {
                                const keyword = e.target.value
                                setCoursePickerQuery(keyword)
                                setIsCoursePickerDropdownOpen(true)
                                if (!keyword.trim()) {
                                  setSelectedCourseId('')
                                }
                              }}
                          />
                          {isCoursePickerDropdownOpen ? (
                              <div
                                  className="course-plans-picker-list"
                                  style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    left: 0,
                                    right: 0,
                                    zIndex: 30,
                                    maxHeight: 280,
                                    overflowY: 'auto',
                                  }}
                              >
                                <button
                                    type="button"
                                    className={`course-plans-picker-option ${selectedCourseId === '' ? 'active' : ''}`}
                                    onClick={() => {
                                      setSelectedCourseId('')
                                      setCoursePickerQuery('')
                                      setIsCoursePickerDropdownOpen(false)
                                    }}
                                >
                                  Chưa chọn khóa học
                                </button>
                                {coursePickerOptions.map((course) => {
                                  const selected = selectedCourseId === course.id
                                  return (
                                      <button
                                          key={course.id}
                                          type="button"
                                          className={`course-plans-picker-option ${selected ? 'active' : ''}`}
                                          onClick={() => {
                                            setSelectedCourseId(course.id)
                                            setCoursePickerQuery(formatCourseLabel(course))
                                            setIsCoursePickerDropdownOpen(false)
                                          }}
                                      >
                                        <span className="course-plans-picker-title">{formatCourseLabel(course)}</span>
                                      </button>
                                  )
                                })}
                                {coursePickerOptions.length === 0 ? <div className="course-plans-picker-empty">Không tìm thấy khóa học.</div> : null}
                              </div>
                          ) : null}
                        </div>
                        <p className="admin-helper">Focus vào ô để mở danh sách gợi ý.</p>
                        {selectedCourse ? <p className="admin-helper">{selectedCourse.title}</p> : null}
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Thẻ</label>
                        <div className="admin-multi-select">
                          {tags.map((tag) => {
                            const checked = selectedCourseTagIds.includes(tag.id)
                            return (
                                <label key={tag.id} className="admin-checkbox-row">
                                  <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => setSelectedCourseTagIds((prev) => e.target.checked ? Array.from(new Set([...prev, tag.id])) : prev.filter((id) => id !== tag.id))}
                                  />
                                  <span>{tag.code} - {tag.name}</span>
                                </label>
                            )
                          })}
                        </div>
                      </div>

                      <div className="admin-row">
                        <button type="submit" className="admin-btn admin-btn-save"><i className="fa-solid fa-floppy-disk" /> Lưu thẻ khóa học</button>
                        <button type="button" className="admin-btn admin-btn-ghost" onClick={closeDrawer}><i className="fa-solid fa-xmark" /> Hủy</button>
                      </div>
                    </form>
                ) : null}
              </aside>
            </div>
        )}
      </main>
  )
}
