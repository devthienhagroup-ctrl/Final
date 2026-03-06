import React, { useEffect, useMemo, useState } from 'react'
import { coursePlansApi, type CoursePlan } from '../../api/coursePlans.api'

type Billing = 'monthly' | 'yearly'

type CmsPricingData = {
  headerTitle?: string
  headerDescription?: string
  monthlyLabel?: string
  yearlyLabel?: string
  yearlyDiscountText?: string
  noPlansText?: string
  loadingText?: string
  errorText?: string
}

interface PricingSectionProps {
  cmsData?: CmsPricingData
}

const defaultCmsData: Required<CmsPricingData> = {
  headerTitle: 'Gói học theo quyền mở khóa',
  headerDescription:
    'Dữ liệu gói được lấy trực tiếp từ hệ thống. Quyền lợi hiển thị bám theo logic pass/quota hiện tại.',
  monthlyLabel: 'Theo tháng',
  yearlyLabel: 'Theo năm',
  yearlyDiscountText: '-20%',
  noPlansText: 'Hiện chưa có gói nào đang mở.',
  loadingText: 'Đang tải gói...',
  errorText: 'Không tải được gói. Vui lòng thử lại sau.',
}

function formatMoney(vnd: number) {
  return `${new Intl.NumberFormat('vi-VN').format(vnd)}đ`
}

function buildBenefits(plan: CoursePlan) {
  const benefits: string[] = []
  benefits.push(`Mở tối đa ${plan.maxUnlocks} khóa học trong mỗi chu kỳ`)
  benefits.push(`Hiệu lực ${plan.durationDays} ngày, grace thêm ${plan.graceDays} ngày`)
  benefits.push('Trong GRACE vẫn có thể mở khóa mới nếu còn quota')

  if (plan.maxCoursePrice != null) {
    benefits.push(`Chỉ mở khóa học có giá <= ${formatMoney(plan.maxCoursePrice)}`)
  } else {
    benefits.push('Không giới hạn giá khóa học')
  }

  if (plan.excludedTags.length > 0) {
    benefits.push(`Không áp dụng cho tag: ${plan.excludedTags.map((tag) => tag.code).join(', ')}`)
  } else {
    benefits.push('Không có tag bị chặn')
  }

  return benefits
}

export function PricingSection({ cmsData }: PricingSectionProps) {
  const [billing, setBilling] = useState<Billing>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<CoursePlan[]>([])

  const data = {
    ...defaultCmsData,
    ...(cmsData || {}),
  }

  useEffect(() => {
    let mounted = true

    async function loadPlans() {
      setLoading(true)
      setError(null)

      try {
        const rows = await coursePlansApi.listPublicPlans()
        if (!mounted) return
        setPlans(rows.filter((plan) => plan.isActive).sort((a, b) => a.price - b.price))
      } catch {
        if (!mounted) return
        setError(data.errorText)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadPlans()
    return () => {
      mounted = false
    }
  }, [data.errorText])

  const hasToken = Boolean(localStorage.getItem('aya_access_token'))

  const pricedPlans = useMemo(() => {
    return plans.map((plan) => {
      const monthlyPrice = plan.price
      const displayPrice = billing === 'yearly' ? Math.round(monthlyPrice * 0.8) : monthlyPrice

      return {
        ...plan,
        displayPrice,
      }
    })
  }, [billing, plans])

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {data.headerTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">{data.headerDescription}</p>
        </div>

        <div className="card p-4 md:p-5">
          <div className="text-sm font-semibold text-slate-900">Chu kỳ hiển thị giá</div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                billing === 'monthly'
                  ? 'bg-slate-900 text-white hover:opacity-90'
                  : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {data.monthlyLabel}
            </button>

            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                billing === 'yearly'
                  ? 'bg-slate-900 text-white hover:opacity-90'
                  : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {data.yearlyLabel}{' '}
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {data.yearlyDiscountText}
              </span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{data.loadingText}</div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
      ) : null}

      {!loading && !error && pricedPlans.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{data.noPlansText}</div>
      ) : null}

      {!loading && !error && pricedPlans.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pricedPlans.map((plan) => (
            <div key={plan.id} className="card p-7 flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{plan.code}</div>
                  <p className="mt-1 text-sm text-slate-600">{plan.name}</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {plan.durationDays} ngày
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-extrabold text-slate-900">{formatMoney(plan.displayPrice)}</div>
                  <div className="pb-1 text-sm text-slate-600">{billing === 'monthly' ? '/tháng' : '/tháng (gói năm)'}</div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Giá chuẩn: {formatMoney(plan.price)}</p>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {buildBenefits(plan).map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="font-bold text-amber-600">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <a
                href={hasToken ? `/account-center?tab=subscriptions&planId=${plan.id}` : '/login'}
                className="mt-6 inline-flex w-full justify-center rounded-2xl btn-primary px-5 py-3 text-sm font-semibold"
              >
                {hasToken ? 'Đăng ký gói này' : 'Đăng nhập để đăng ký'}
              </a>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
