import { request } from '../../app/api'

export type CoursePlanTag = {
  id: number
  code: string
  name: string
  createdAt?: string
  updatedAt?: string
  _count?: {
    courseLinks: number
    excludedInPlans: number
  }
}

export type CoursePlan = {
  id: number
  code: string
  name: string
  price: number
  currency?: 'vnd' | 'usd'
  billingInterval?: 'month' | 'year'
  stripeProductId?: string | null
  currentStripePriceId?: string | null
  durationDays: number
  graceDays: number
  maxUnlocks: number
  maxCoursePrice: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  excludedTagIds: number[]
  excludedTags: Array<{ id: number; code: string; name: string }>
}

export type CoursePass = {
  id: number
  userId: number
  planId: number
  purchaseId?: number | null
  startAt: string
  endAt: string
  graceUntil: string
  remainingUnlocks: number
  status: 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELED'
  computedStatus: 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELED'
  canceledAt?: string | null
  unlockCount: number
  plan: CoursePlan
}

export type CourseListItem = {
  id: number
  title: string
  slug: string
  topic?: { id: number; name: string } | null
  tagLinks?: Array<{ tagId: number; tag: { id: number; code: string; name: string } }>
}

export type CourseListResponse = {
  items: CourseListItem[]
  total: number
  page: number
  pageSize: number
}

export type CoursePlansOverview = {
  tagCount: number
  planCount: number
  activePlanCount: number
  passCount: number
  activePassCount: number
  gracePassCount: number
  subscriberCount: number
  totalQuota: number
  usedQuota: number
  remainingQuota: number
}

export const coursePlansApi = {
  listTags: () => request<CoursePlanTag[]>('/admin/course-tags'),
  createTag: (payload: { code: string; name: string }) =>
    request<CoursePlanTag>('/admin/course-tags', { method: 'POST', body: JSON.stringify(payload) }),
  updateTag: (id: number, payload: { code?: string; name?: string }) =>
    request<CoursePlanTag>(`/admin/course-tags/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTag: (id: number) => request<{ id: number }>(`/admin/course-tags/${id}`, { method: 'DELETE' }),

  getOverview: () => request<CoursePlansOverview>('/admin/course-plans/overview'),
  listPlans: () => request<CoursePlan[]>('/admin/course-plans?includeInactive=true'),
  createPlan: (payload: {
    code: string
    name: string
    price: number
    currency?: 'vnd' | 'usd'
    billingInterval?: 'month' | 'year'
    stripeProductId?: string
    durationDays: number
    graceDays: number
    maxUnlocks: number
    maxCoursePrice?: number | null
    isActive?: boolean
    excludedTagIds?: number[]
  }) => request<CoursePlan>('/admin/course-plans', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlan: (id: number, payload: Partial<{
    code: string
    name: string
    price: number
    currency: 'vnd' | 'usd'
    billingInterval: 'month' | 'year'
    stripeProductId: string
    durationDays: number
    graceDays: number
    maxUnlocks: number
    maxCoursePrice: number | null
    isActive: boolean
    excludedTagIds: number[]
  }>) => request<CoursePlan>(`/admin/course-plans/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePlan: (id: number) => request<{ id: number }>(`/admin/course-plans/${id}`, { method: 'DELETE' }),

  listPasses: (params?: { userId?: number; planId?: number; status?: CoursePass['computedStatus'] }) => {
    const query = new URLSearchParams()
    if (params?.userId) query.set('userId', String(params.userId))
    if (params?.planId) query.set('planId', String(params.planId))
    if (params?.status) query.set('status', params.status)
    const suffix = query.toString()
    return request<CoursePass[]>(`/admin/course-passes${suffix ? `?${suffix}` : ''}`)
  },
  createPass: (payload: { userId: number; planId: number; purchaseId?: number; startAt?: string }) =>
    request<CoursePass>('/admin/course-passes', { method: 'POST', body: JSON.stringify(payload) }),
  renewPass: (id: number, payload?: { renewAt?: string; purchaseId?: number }) =>
    request<CoursePass>(`/admin/course-passes/${id}/renew`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  cancelPass: (id: number) => request<{ id: number; status: string }>(`/admin/course-passes/${id}/cancel`, { method: 'POST' }),

  listCourses: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams()
    query.set('page', String(params?.page ?? 1))
    query.set('pageSize', String(params?.pageSize ?? 50))
    return request<CourseListResponse>(`/courses?${query.toString()}`)
  },
  setCourseTags: (courseId: number, tagIds: number[]) =>
    request(`/admin/courses/${courseId}/tags`, { method: 'PUT', body: JSON.stringify({ tagIds }) }),
}
