import { http } from './http'

export type CoursePlanTag = {
  id: number
  code: string
  name: string
}

export type CoursePlan = {
  id: number
  code: string
  name: string
  price: number
  durationDays: number
  graceDays: number
  maxUnlocks: number
  maxCoursePrice: number | null
  isActive: boolean
  excludedTags: CoursePlanTag[]
  excludedTagIds: number[]
  createdAt?: string
  updatedAt?: string
}

export type CoursePassStatus = 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELED'

export type CoursePass = {
  id: number
  userId: number
  planId: number
  purchaseId?: number | null
  startAt: string
  endAt: string
  graceUntil: string
  remainingUnlocks: number
  status: CoursePassStatus
  computedStatus: CoursePassStatus
  canUnlockNew?: boolean
  canceledAt?: string | null
  unlockCount: number
  plan: CoursePlan
}

export type CoursePlanPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'

export type CoursePlanPayment = {
  id: number
  userId: number
  planId: number
  provider: string
  status: CoursePlanPaymentStatus
  computedStatus: CoursePlanPaymentStatus
  amount: number
  transferCode: string
  transferContent: string
  paidAt?: string | null
  expiredAt?: string | null
  createdAt: string
  updatedAt: string
  plan: CoursePlan
  pass?: {
    id: number
    planId: number
    purchaseId?: number | null
    startAt: string
    endAt: string
    graceUntil: string
    remainingUnlocks: number
    status: CoursePassStatus
    computedStatus: CoursePassStatus
    canceledAt?: string | null
    createdAt: string
  } | null
  sepay?: {
    webhookUrl: string
    amount: number
    accountName: string
    accountNumber: string
    bankName: string
    bankCode: string
    transferContent: string
    qrUrl: string
    expiresAt?: string | null
  } | null
}

export type CoursePlanCheckoutResponse =
  | {
      mode: 'FREE'
      pass: CoursePass
    }
  | {
      mode: 'SEPAY'
      payment: CoursePlanPayment
    }

export const coursePlansApi = {
  listPublicPlans: async () => {
    const { data } = await http.get<CoursePlan[]>('/course-plans')
    return data
  },

  purchasePlan: async (planId: number) => {
    const { data } = await http.post<CoursePlanCheckoutResponse>(`/course-plans/${planId}/purchase`, {})
    return data
  },

  listMyPasses: async () => {
    const { data } = await http.get<CoursePass[]>('/me/course-passes')
    return data
  },

  listMyPayments: async () => {
    const { data } = await http.get<CoursePlanPayment[]>('/me/course-plan-payments')
    return data
  },
}

