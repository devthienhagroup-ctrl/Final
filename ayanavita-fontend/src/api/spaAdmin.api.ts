import { del, get, patch, post, request } from './http'

export type Branch = { id: number; code: string; name: string; address: string; phone?: string }
export type SpaService = {
  id: number
  code: string
  name: string
  description?: string
  category?: string
  goals: string[]
  durationMin: number
  price: number
  ratingAvg: number
  icon?: string
  imageUrl?: string
  branchIds: number[]
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
  branches: () => get<Branch[]>('/booking/branches', { auth: false }),
  services: () => get<SpaService[]>('/booking/services', { auth: false }),
  specialists: () => get<Specialist[]>('/booking/specialists', { auth: false }),
  reviews: () => get<ServiceReview[]>('/booking/service-reviews', { auth: false }),
  appointments: () => get<Appointment[]>('/booking/appointments', { auth: false }),

  createBranch: (data: Partial<Branch>) => post('/booking/branches', data, { auth: false }),
  updateBranch: (id: number, data: Partial<Branch>) => patch(`/booking/branches/${id}`, data, { auth: false }),
  deleteBranch: (id: number) => del(`/booking/branches/${id}`, { auth: false }),

  createService: (data: any) => post('/booking/services', data, { auth: false }),
  updateService: (id: number, data: any) => patch(`/booking/services/${id}`, data, { auth: false }),
  deleteService: (id: number) => del(`/booking/services/${id}`, { auth: false }),

  createSpecialist: (data: any) => post('/booking/specialists', data, { auth: false }),
  updateSpecialist: (id: number, data: any) => patch(`/booking/specialists/${id}`, data, { auth: false }),
  deleteSpecialist: (id: number) => del(`/booking/specialists/${id}`, { auth: false }),

  createReview: (data: any) => post('/booking/service-reviews', data, { auth: false }),
  deleteReview: (id: number) => del(`/booking/service-reviews/${id}`, { auth: false }),

  updateAppointment: (id: number, data: any) => patch(`/booking/appointments/${id}`, data, { auth: false }),
  deleteAppointment: (id: number) => del(`/booking/appointments/${id}`, { auth: false }),

  syncRelations: (payload: any) => post('/booking/relations/sync', payload, { auth: false }),

  uploadCloudImage: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ url: string; fileName: string; size: number }>('/booking/images/cloud', {
      method: 'POST',
      body: form,
      auth: false,
    })
  },

  deleteCloudImage: (input: { fileName?: string; url?: string }) =>
    request<{ ok: boolean }>('/booking/images/cloud', {
      method: 'DELETE',
      body: input,
      auth: false,
    }),
}
