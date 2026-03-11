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
  currency?: 'vnd' | 'usd'
  billingInterval?: 'month' | 'year'
  stripeProductId?: string | null
  currentStripePriceId?: string | null
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
export type CoursePlanPaymentSource = 'SEPAY_QR' | 'STRIPE_ONE_TIME' | 'STRIPE_SUBSCRIPTION'

export type CoursePlanSubscriptionSnapshot = {
  stripeSubscriptionId: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  canceledAt?: string | null
}

export type CoursePlanPayment = {
  id: number
  userId: number
  planId: number
  provider: string
  paymentSource?: CoursePlanPaymentSource
  status: CoursePlanPaymentStatus
  computedStatus: CoursePlanPaymentStatus
  amount: number
  transferCode: string
  transferContent: string
  stripeCheckoutSessionId?: string | null
  stripePaymentIntentId?: string | null
  stripeInvoiceId?: string | null
  stripeSubscriptionId?: string | null
  subscriptionStatus?: string | null
  cancelAtPeriodEnd?: boolean
  subscriptionCurrentPeriodStart?: string | null
  subscriptionCurrentPeriodEnd?: string | null
  subscriptionCanceledAt?: string | null
  subscription?: CoursePlanSubscriptionSnapshot | null
  failureReason?: string | null
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

export type CoursePlanCheckoutMethod = 'SEPAY' | 'STRIPE_ONE_TIME' | 'STRIPE_SUBSCRIPTION'

export type CoursePlanCheckoutResponse =
  | {
      mode: 'FREE'
      pass: CoursePass
    }
  | {
      mode: 'SEPAY'
      payment: CoursePlanPayment
    }
  | {
      mode: 'STRIPE'
      stripeMode: 'ONE_TIME' | 'SUBSCRIPTION'
      checkoutUrl: string
      payment: CoursePlanPayment
    }

export type CoursePlanSubscriptionActionResponse = {
  ok: boolean
  alreadyCanceled?: boolean
  alreadyResumed?: boolean
  planId: number
  subscription?: CoursePlanSubscriptionSnapshot | null
}

export const coursePlansApi = {
  listPublicPlans: async () => {
    const { data } = await http.get<CoursePlan[]>('/course-plans')
    return data
  },

  purchasePlan: async (
    planId: number,
    options?: {
      method?: CoursePlanCheckoutMethod
      successUrl?: string
      cancelUrl?: string
    },
  ) => {
    const { data } = await http.post<CoursePlanCheckoutResponse>(`/course-plans/${planId}/purchase`, options || {})
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

  cancelAutoRenewal: async (payload?: { passId?: number; planId?: number }) => {
    const { data } = await http.post<CoursePlanSubscriptionActionResponse>(
      '/me/course-plan-subscriptions/cancel-renewal',
      payload || {},
    )
    return data
  },

  resumeAutoRenewal: async (payload?: { passId?: number; planId?: number }) => {
    const { data } = await http.post<CoursePlanSubscriptionActionResponse>(
      '/me/course-plan-subscriptions/resume-renewal',
      payload || {},
    )
    return data
  },
}
