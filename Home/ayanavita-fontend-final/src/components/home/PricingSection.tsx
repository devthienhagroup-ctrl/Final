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
  durationDaysSuffix?: string
  monthlyPriceSuffix?: string
  yearlyPriceSuffix?: string
  basePriceLabel?: string
  subscribeButtonText?: string
  loginToSubscribeButtonText?: string
  benefits?: {
    maxUnlocks?: string
    validDaysAndGrace?: string
    graceUnlockText?: string
    maxCoursePrice?: string
    unlimitedCoursePrice?: string
    excludedTags?: string
    noExcludedTags?: string
  }
}

interface PricingSectionProps {
  cmsData?: CmsPricingData
}

const defaultCmsData: Required<CmsPricingData> = {
  headerTitle: 'Chọn gói trải nghiệm phù hợp với bạn',
  headerDescription:
      'Khám phá các gói dịch vụ wellness được thiết kế để đồng hành cùng nhu cầu chăm sóc và hành trình cân bằng của bạn.',
  monthlyLabel: 'Theo tháng',
  yearlyLabel: 'Theo năm',
  yearlyDiscountText: '-20%',
  noPlansText: 'Hiện chưa có gói dịch vụ nào khả dụng.',
  loadingText: 'Đang tải gói dịch vụ...',
  errorText: 'Không thể tải danh sách gói. Vui lòng thử lại sau.',
  durationDaysSuffix: 'ngày',
  monthlyPriceSuffix: '/tháng',
  yearlyPriceSuffix: '/tháng (gói năm)',
  basePriceLabel: 'Giá chuẩn',
  subscribeButtonText: 'Đăng ký gói này',
  loginToSubscribeButtonText: 'Đăng nhập để đăng ký',
  benefits: {
    maxUnlocks: 'Trải nghiệm tối đa {maxUnlocks} quyền lợi trong mỗi chu kỳ',
    validDaysAndGrace: 'Hiệu lực {durationDays} ngày, cộng thêm {graceDays} ngày gia hạn',
    graceUnlockText: 'Trong thời gian gia hạn, bạn vẫn có thể tiếp tục sử dụng nếu còn quyền lợi',
    maxCoursePrice: 'Áp dụng cho dịch vụ có giá đến {maxCoursePrice}',
    unlimitedCoursePrice: 'Không giới hạn mức giá dịch vụ áp dụng',
    excludedTags: 'Không áp dụng cho nhóm: {tags}',
    noExcludedTags: 'Không có nhóm dịch vụ bị giới hạn',
  },
}

function formatMoney(vnd: number) {
  return `${new Intl.NumberFormat('vi-VN').format(vnd)}đ`
}

function fillTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
}

function buildBenefits(plan: CoursePlan, data: Required<CmsPricingData>) {
  const benefits: string[] = []
  const benefitText = data.benefits

  benefits.push(
      fillTemplate(benefitText.maxUnlocks, {
        maxUnlocks: plan.maxUnlocks,
      }),
  )

  benefits.push(
      fillTemplate(benefitText.validDaysAndGrace, {
        durationDays: plan.durationDays,
        graceDays: plan.graceDays,
      }),
  )

  benefits.push(benefitText.graceUnlockText)

  if (plan.maxCoursePrice != null) {
    benefits.push(
        fillTemplate(benefitText.maxCoursePrice, {
          maxCoursePrice: formatMoney(plan.maxCoursePrice),
        }),
    )
  } else {
    benefits.push(benefitText.unlimitedCoursePrice)
  }

  if (plan.excludedTags.length > 0) {
    benefits.push(
        fillTemplate(benefitText.excludedTags, {
          tags: plan.excludedTags.map((tag) => tag.code).join(', '),
        }),
    )
  } else {
    benefits.push(benefitText.noExcludedTags)
  }

  return benefits
}

export function PricingSection({ cmsData }: PricingSectionProps) {
  const [billing, setBilling] = useState<Billing>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<CoursePlan[]>([])

  const data: Required<CmsPricingData> = {
    ...defaultCmsData,
    ...(cmsData || {}),
    benefits: {
      ...defaultCmsData.benefits,
      ...(cmsData?.benefits || {}),
    },
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
            <h2 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-semibold text-transparent">
              {data.headerTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">{data.headerDescription}</p>
          </div>

          {/*<div className="card p-4 md:p-5">*/}
          {/*  <div className="text-sm font-semibold text-slate-900">Chu kỳ hiển thị giá</div>*/}
          {/*  <div className="mt-3 flex items-center gap-3">*/}
          {/*    <button*/}
          {/*      type="button"*/}
          {/*      onClick={() => setBilling('monthly')}*/}
          {/*      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${*/}
          {/*        billing === 'monthly'*/}
          {/*          ? 'bg-slate-900 text-white hover:opacity-90'*/}
          {/*          : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50'*/}
          {/*      }`}*/}
          {/*    >*/}
          {/*      {data.monthlyLabel}*/}
          {/*    </button>*/}

          {/*    <button*/}
          {/*      type="button"*/}
          {/*      onClick={() => setBilling('yearly')}*/}
          {/*      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${*/}
          {/*        billing === 'yearly'*/}
          {/*          ? 'bg-slate-900 text-white hover:opacity-90'*/}
          {/*          : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50'*/}
          {/*      }`}*/}
          {/*    >*/}
          {/*      {data.yearlyLabel}{' '}*/}
          {/*      <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">*/}
          {/*        {data.yearlyDiscountText}*/}
          {/*      </span>*/}
          {/*    </button>*/}
          {/*  </div>*/}
          {/*</div>*/}
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
                  <div key={plan.id} className="card flex flex-col p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{plan.code}</div>
                        <p className="mt-1 text-sm text-slate-600">{plan.name}</p>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {plan.durationDays} {data.durationDaysSuffix}
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-end gap-2">
                        <div className="text-4xl font-extrabold text-slate-900">{formatMoney(plan.displayPrice)}</div>
                        <div className="pb-1 text-sm text-slate-600">
                          {billing === 'monthly' ? data.monthlyPriceSuffix : data.yearlyPriceSuffix}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {data.basePriceLabel}: {formatMoney(plan.price)}
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2 text-sm text-slate-700">
                      {buildBenefits(plan, data).map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2">
                            <span className="font-bold text-amber-600">•</span>
                            <span>{benefit}</span>
                          </li>
                      ))}
                    </ul>

                    <a
                        href={hasToken ? `/account-center?tab=subscriptions&planId=${plan.id}` : '/login'}
                        className="btn-primary mt-6 inline-flex w-full justify-center rounded-2xl px-5 py-3 text-sm font-semibold"
                    >
                      {hasToken ? data.subscribeButtonText : data.loginToSubscribeButtonText}
                    </a>
                  </div>
              ))}
            </div>
        ) : null}
      </section>
  )
}
