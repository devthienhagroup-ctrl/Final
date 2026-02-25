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
}
export type ServiceCategory = {
  id: number
  name: string
  serviceCount: number
}
export type Specialist = {
  id: number
  code: string
  name: string
  level: string
  bio?: string
  branchIds: number[]
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
export type Appointment = {
  id: number
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
  branches: (includeInactive = false) => get<Branch[]>(`/booking/branches${includeInactive ? '?includeInactive=true' : ''}`, { auth: false }),
  services: () => get<SpaService[]>('/booking/services', { auth: false }),
  serviceCategories: () => get<ServiceCategory[]>('/booking/service-categories', { auth: false }),
  specialists: () => get<Specialist[]>('/booking/specialists', { auth: false }),
  reviews: () => get<ServiceReview[]>('/booking/service-reviews', { auth: false }),
  appointments: () => get<Appointment[]>('/booking/appointments', { auth: false }),

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

  updateAppointment: (id: number, data: any) => patch(`/booking/appointments/${id}`, data, { auth: false }),
  deleteAppointment: (id: number) => del(`/booking/appointments/${id}`, { auth: false }),

  syncRelations: (payload: any) => post('/booking/relations/sync', payload, { auth: false }),

}
