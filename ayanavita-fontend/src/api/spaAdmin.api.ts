import { del, get, patch, post, request } from './http'

export type Branch = { id: number; code: string; name: string; address: string; phone?: string; isActive: boolean }
export type SpaService = {
  id: number
  name: string
  description?: string
  categoryId?: number
  category?: string
  goals: string[]
  suitableFor: string[]
  process: string[]
  durationMin: number
  price: number
  ratingAvg: number
  bookedCount: number
  imageUrl?: string
  tag?: string
  branchIds: number[]
  isActive: boolean
}
export type PaginatedServiceResponse = {
  items: SpaService[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ServiceCategory = {
  id: number
  name: string
  serviceCount: number
}
export type Specialist = {
  id: number
  name: string
  email: string
  level: string
  bio?: string
  branchId: number
  serviceIds: number[]
}
export type ServiceReview = {
  id: number
  serviceId: number
  userId?: number
  stars: number
  comment?: string
  customerName?: string
  createdAt: string
}

export type AppointmentStatsResponse = {
  total: number
  byStatus: Record<string, number>
  byService: Array<{ label: string; value: number }>
  bySpecialist: Array<{ label: string; value: number }>
  byMonth: Array<{ label: string; value: number }>
}

export type Appointment = {
  id: number
  code?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  appointmentAt: string
  status: string
  note?: string
  branch?: { id: number; name: string }
  service?: { id: number; name: string }
  specialist?: { id: number; name: string }
}

export const spaAdminApi = {
  branches: (params?: boolean | { includeInactive?: boolean; serviceId?: number }) => {
    const includeInactive = typeof params === 'boolean' ? params : (params?.includeInactive ?? false)
    const serviceId = typeof params === 'object' ? params.serviceId : undefined
    const query = new URLSearchParams()
    if (includeInactive) query.set('includeInactive', 'true')
    if (serviceId) query.set('serviceId', String(serviceId))
    const queryString = query.toString()
    return get<Branch[]>(`/booking/branches${queryString ? `?${queryString}` : ''}`, { auth: false })
  },
  services: (params?: { q?: string; page?: number; pageSize?: number; branchId?: number; includeInactive?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.q?.trim()) query.set('q', params.q.trim())
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    if (params?.branchId) query.set('branchId', String(params.branchId))
    if (params?.includeInactive) query.set('includeInactive', 'true')
    const queryString = query.toString()
    return get<PaginatedServiceResponse>(`/booking/services${queryString ? `?${queryString}` : ''}`, { auth: false })
  },
  serviceCategories: () => get<ServiceCategory[]>('/booking/service-categories', { auth: false }),
  specialists: (params?: { branchId?: number; serviceId?: number }) => {
    const query = new URLSearchParams()
    if (params?.branchId) query.set('branchId', String(params.branchId))
    if (params?.serviceId) query.set('serviceId', String(params.serviceId))
    const queryString = query.toString()
    return get<Specialist[]>(`/booking/specialists${queryString ? `?${queryString}` : ''}`, { auth: false })
  },
  reviews: () => get<ServiceReview[]>('/booking/service-reviews', { auth: false }),
  appointments: () => get<Appointment[]>('/booking/appointments'),
  appointmentStats: (params?: { customerPhone?: string; branchId?: number; serviceId?: number; specialistId?: number }) => {
    const query = new URLSearchParams()
    if (params?.customerPhone?.trim()) query.set('customerPhone', params.customerPhone.trim())
    if (params?.branchId) query.set('branchId', String(params.branchId))
    if (params?.serviceId) query.set('serviceId', String(params.serviceId))
    if (params?.specialistId) query.set('specialistId', String(params.specialistId))
    const queryString = query.toString()
    return get<AppointmentStatsResponse>(`/booking/appointments/stats${queryString ? `?${queryString}` : ''}`)
  },

  createBranch: (data: Partial<Branch>) => post('/booking/branches', data, { auth: false }),
  updateBranch: (id: number, data: Partial<Branch>) => patch(`/booking/branches/${id}`, data, { auth: false }),
  deleteBranch: (id: number) => del(`/booking/branches/${id}`, { auth: false }),

  createService: (data: Record<string, any>, file?: File | null) => {
    const form = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      form.append(key, typeof value === 'string' ? value : JSON.stringify(value))
    })
    if (file) form.append('file', file)
    return request('/booking/services', { method: 'POST', body: form, auth: false })
  },
  updateService: (id: number, data: Record<string, any>, file?: File | null) => {
    const form = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      form.append(key, typeof value === 'string' ? value : JSON.stringify(value))
    })
    if (file) form.append('file', file)
    return request(`/booking/services/${id}`, { method: 'PATCH', body: form, auth: false })
  },
  deleteService: (id: number) => del(`/booking/services/${id}`, { auth: false }),

  createServiceCategory: (data: Partial<ServiceCategory>) => post('/booking/service-categories', data, { auth: false }),
  updateServiceCategory: (id: number, data: Partial<ServiceCategory>) => patch(`/booking/service-categories/${id}`, data, { auth: false }),
  deleteServiceCategory: (id: number) => del(`/booking/service-categories/${id}`, { auth: false }),

  createSpecialist: (data: any) => post('/booking/specialists', data, { auth: false }),
  updateSpecialist: (id: number, data: any) => patch(`/booking/specialists/${id}`, data, { auth: false }),
  deleteSpecialist: (id: number) => del(`/booking/specialists/${id}`, { auth: false }),

  createReview: (data: any) => post('/booking/service-reviews', data, { auth: false }),
  deleteReview: (id: number) => del(`/booking/service-reviews/${id}`, { auth: false }),

  updateAppointment: (id: number, data: any) => patch(`/booking/appointments/${id}`, data),
  deleteAppointment: (id: number) => del(`/booking/appointments/${id}`),
}
