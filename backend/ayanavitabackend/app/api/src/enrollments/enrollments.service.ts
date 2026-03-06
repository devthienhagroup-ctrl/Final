import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CourseAccessStatus, CourseEntitlementSourceType, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { JwtUser } from '../auth/decorators/current-user.decorator'
import { hasAnyPermission } from '../auth/permission-utils'

type PassForPlanCheck = {
  id: number
  planId: number
  endAt: Date
  graceUntil: Date
  plan: {
    id: number
    code: string
    name: string
    price: number
    isActive: boolean
    maxCoursePrice: number | null
    excludedTags: Array<{ tagId: number }>
  }
}

type PlanForUpgrade = {
  id: number
  code: string
  name: string
  price: number
  maxCoursePrice: number | null
  excludedTags: Array<{ tagId: number }>
}

type CourseForPlanCheck = {
  id: number
  price: number
  tagLinks: Array<{
    tagId: number
    tag: {
      code: string
    }
  }>
}

type PlanUpgradeHint = {
  id: number
  code: string
  name: string
  price: number
}

type PlanAccessDecision = {
  canAccess: boolean
  blockedReason: 'PLAN_EXPIRED' | 'PLAN_UPGRADE_REQUIRED' | null
  blockedMessage: string | null
  upgradePlan: PlanUpgradeHint | null
}

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveLocale(lang?: string) {
    const normalized = (lang || 'vi').toLowerCase()
    if (normalized === 'en' || normalized === 'de') return normalized
    return 'vi'
  }

  private isPlanEligibleForCourse(
    plan: { maxCoursePrice: number | null; excludedTags: Array<{ tagId: number }> },
    course: CourseForPlanCheck,
  ) {
    if (plan.maxCoursePrice !== null && course.price > plan.maxCoursePrice) return false

    if (!course.tagLinks.length || !plan.excludedTags.length) return true

    const excludedTagIds = new Set(plan.excludedTags.map((item) => item.tagId))
    for (const row of course.tagLinks) {
      if (excludedTagIds.has(row.tagId)) return false
    }

    return true
  }

  private findRecommendedUpgradePlan(course: CourseForPlanCheck, activePlans: PlanForUpgrade[]) {
    const matched = activePlans.find((plan) => this.isPlanEligibleForCourse(plan, course))
    if (!matched) return null

    return {
      id: matched.id,
      code: matched.code,
      name: matched.name,
      price: matched.price,
    }
  }

  private buildPlanAccessDecision(
    course: CourseForPlanCheck,
    activePasses: PassForPlanCheck[],
    activePlans: PlanForUpgrade[],
  ): PlanAccessDecision {
    const enabledPasses = activePasses.filter((pass) => pass.plan.isActive)

    if (enabledPasses.length === 0) {
      const upgradePlan = this.findRecommendedUpgradePlan(course, activePlans)
      return {
        canAccess: false,
        blockedReason: 'PLAN_EXPIRED',
        blockedMessage: 'Goi dang ky cua ban da het han. Vui long gia han de tiep tuc xem khoa hoc nay.',
        upgradePlan,
      }
    }

    const eligiblePass = enabledPasses.find((pass) => this.isPlanEligibleForCourse(pass.plan, course))
    if (eligiblePass) {
      return {
        canAccess: true,
        blockedReason: null,
        blockedMessage: null,
        upgradePlan: null,
      }
    }

    const upgradePlan = this.findRecommendedUpgradePlan(course, activePlans)
    if (upgradePlan) {
      return {
        canAccess: false,
        blockedReason: 'PLAN_UPGRADE_REQUIRED',
        blockedMessage: `Goi hien tai khong du dieu kien. Vui long nang cap len goi ${upgradePlan.name} de tiep tuc xem.`,
        upgradePlan,
      }
    }

    return {
      canAccess: false,
      blockedReason: 'PLAN_UPGRADE_REQUIRED',
      blockedMessage: 'Goi hien tai khong du dieu kien cho khoa hoc nay. Vui long nang cap goi de tiep tuc xem.',
      upgradePlan: null,
    }
  }

  private async listCurrentPasses(userId: number, now: Date) {
    return this.prisma.userCoursePass.findMany({
      where: {
        userId,
        canceledAt: null,
        startAt: { lte: now },
        graceUntil: { gt: now },
      },
      select: {
        id: true,
        planId: true,
        endAt: true,
        graceUntil: true,
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true,
            isActive: true,
            maxCoursePrice: true,
            excludedTags: { select: { tagId: true } },
          },
        },
      },
      orderBy: [{ graceUntil: 'asc' }, { endAt: 'asc' }, { id: 'asc' }],
    })
  }

  private async listActivePlansForUpgrade() {
    return this.prisma.coursePlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        maxCoursePrice: true,
        excludedTags: { select: { tagId: true } },
      },
      orderBy: [{ price: 'asc' }, { id: 'asc' }],
    })
  }

  async myEnrollments(userId: number, status?: CourseAccessStatus | 'ALL') {
    const where: Prisma.CourseAccessWhereInput = {
      userId,
      ...(status && status !== 'ALL' ? { status } : {}),
    }

    const accessRows = await this.prisma.courseAccess.findMany({
      where,
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        grantedAt: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnail: true,
            price: true,
            published: true,
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })

    if (status === CourseAccessStatus.CANCELED) return accessRows

    const now = new Date()
    const entitlementRows = await this.prisma.courseEntitlement.findMany({
      where: {
        userId,
        accessStartAt: { lte: now },
        OR: [{ accessEndAt: null }, { accessEndAt: { gt: now } }],
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        sourceType: true,
        sourceId: true,
        accessStartAt: true,
        accessEndAt: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnail: true,
            price: true,
            published: true,
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })

    const entitlementMapped = entitlementRows.map((row) => ({
      id: row.id,
      userId: row.userId,
      courseId: row.courseId,
      status: CourseAccessStatus.ACTIVE,
      grantedAt: row.accessStartAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      accessEndAt: row.accessEndAt,
      canAccess: true,
      blockedReason: null,
      blockedMessage: null,
      upgradePlan: null,
      course: row.course,
    }))

    return [...accessRows, ...entitlementMapped].sort((a, b) => {
      const aTime = a.updatedAt.getTime()
      const bTime = b.updatedAt.getTime()
      if (aTime !== bTime) return bTime - aTime
      return b.id - a.id
    })
  }

  async grantAccess(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) throw new NotFoundException('Course not found')

    return this.prisma.courseAccess.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { status: CourseAccessStatus.ACTIVE, grantedAt: new Date() },
      create: { userId, courseId, status: CourseAccessStatus.ACTIVE },
      select: { id: true, userId: true, courseId: true, status: true, grantedAt: true, updatedAt: true },
    })
  }

  async myCourses(userId: number, lang?: string) {
    const locale = this.resolveLocale(lang)
    const now = new Date()
    const locales = [locale, 'vi']

    const courseSelect = {
      id: true,
      title: true,
      translations: {
        where: { locale: { in: locales } },
        select: {
          locale: true,
          title: true,
          description: true,
        },
      },
      slug: true,
      description: true,
      thumbnail: true,
      price: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      tagLinks: {
        select: {
          tagId: true,
          tag: {
            select: {
              code: true,
            },
          },
        },
      },
      _count: { select: { lessons: true } },
    } as const

    const [accessRows, entitlementRows, activePasses, activePlans] = await Promise.all([
      this.prisma.courseAccess.findMany({
        where: { userId, status: CourseAccessStatus.ACTIVE },
        select: {
          id: true,
          courseId: true,
          status: true,
          grantedAt: true,
          course: { select: courseSelect },
        },
        orderBy: { grantedAt: 'desc' },
      }),
      this.prisma.courseEntitlement.findMany({
        where: { userId },
        select: {
          id: true,
          courseId: true,
          sourceType: true,
          sourceId: true,
          accessStartAt: true,
          accessEndAt: true,
          course: { select: courseSelect },
        },
        orderBy: { accessStartAt: 'desc' },
      }),
      this.listCurrentPasses(userId, now),
      this.listActivePlansForUpgrade(),
    ])

    const planDecisionByCourseId = new Map<number, PlanAccessDecision>()

    const byCourseId = new Map<number, {
      id: number
      courseId: number
      status: CourseAccessStatus
      grantedAt: Date
      accessEndAt?: Date | null
      sourceType?: string
      sourceId?: number | null
      canAccess: boolean
      blockedReason: 'PLAN_EXPIRED' | 'PLAN_UPGRADE_REQUIRED' | null
      blockedMessage: string | null
      upgradePlan: PlanUpgradeHint | null
      course: any
    }>()

    for (const row of accessRows) {
      byCourseId.set(row.courseId, {
        id: row.id,
        courseId: row.courseId,
        status: row.status,
        grantedAt: row.grantedAt,
        course: row.course,
        canAccess: true,
        blockedReason: null,
        blockedMessage: null,
        upgradePlan: null,
      })
    }

    for (const row of entitlementRows) {
      const isPlanEntitlement = row.sourceType === CourseEntitlementSourceType.PLAN_PASS
      const isActiveByTime = row.accessStartAt <= now && (!row.accessEndAt || row.accessEndAt > now)

      if (!isPlanEntitlement && !isActiveByTime) {
        continue
      }

      let canAccess = true
      let blockedReason: 'PLAN_EXPIRED' | 'PLAN_UPGRADE_REQUIRED' | null = null
      let blockedMessage: string | null = null
      let upgradePlan: PlanUpgradeHint | null = null

      if (isPlanEntitlement) {
        const cached = planDecisionByCourseId.get(row.courseId)
        const decision =
          cached ||
          this.buildPlanAccessDecision(
            {
              id: row.course.id,
              price: row.course.price,
              tagLinks: row.course.tagLinks,
            },
            activePasses,
            activePlans,
          )

        if (!cached) planDecisionByCourseId.set(row.courseId, decision)

        canAccess = decision.canAccess
        blockedReason = decision.blockedReason
        blockedMessage = decision.blockedMessage
        upgradePlan = decision.upgradePlan
      }

      const candidate = {
        id: row.id,
        courseId: row.courseId,
        status: CourseAccessStatus.ACTIVE,
        grantedAt: row.accessStartAt,
        accessEndAt: row.accessEndAt,
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        canAccess,
        blockedReason,
        blockedMessage,
        upgradePlan,
        course: row.course,
      }

      const existing = byCourseId.get(row.courseId)
      if (!existing) {
        byCourseId.set(row.courseId, candidate)
        continue
      }

      if (existing.canAccess && !candidate.canAccess) {
        continue
      }

      if (!existing.canAccess && candidate.canAccess) {
        byCourseId.set(row.courseId, candidate)
        continue
      }

      if (existing.grantedAt < candidate.grantedAt) {
        byCourseId.set(row.courseId, candidate)
      }
    }

    return Array.from(byCourseId.values()).sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime())
  }

  async myCoursesWithProgress(user: JwtUser, lang?: string) {
    const userId = user.sub
    const isAdmin = hasAnyPermission(user, ['courses.manage', 'courses.write', 'courses.publish'])
    const locale = this.resolveLocale(lang)
    const accesses = await this.myCourses(userId, locale)

    if (accesses.length === 0) return []

    const completed = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        ...(isAdmin ? {} : { lesson: { published: true } }),
      },
      select: {
        lesson: { select: { courseId: true } },
      },
    })

    const completedCountByCourse = new Map<number, number>()
    for (const x of completed) {
      const courseId = x.lesson.courseId
      completedCountByCourse.set(courseId, (completedCountByCourse.get(courseId) || 0) + 1)
    }

    const courseIds = accesses.map((e) => e.course.id)
    const totals = await this.prisma.lesson.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds },
        ...(isAdmin ? {} : { published: true }),
      },
      _count: { _all: true },
    })
    const totalByCourse = new Map<number, number>(totals.map((t) => [t.courseId, t._count._all]))

    return accesses.map((e) => {
      const totalLessons = totalByCourse.get(e.course.id) || 0
      const completedLessons = completedCountByCourse.get(e.course.id) || 0
      const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100)

      return {
        id: e.id,
        courseId: e.courseId,
        status: e.status,
        grantedAt: e.grantedAt,
        accessEndAt: e.accessEndAt ?? null,
        sourceType: e.sourceType ?? null,
        sourceId: e.sourceId ?? null,
        canAccess: e.canAccess !== false,
        blockedReason: e.blockedReason ?? null,
        blockedMessage: e.blockedMessage ?? null,
        upgradePlan: e.upgradePlan ?? null,
        course: {
          ...e.course,
          title:
            (e.course as any).translations?.find((item: any) => item.locale === locale)?.title ||
            (e.course as any).translations?.find((item: any) => item.locale === 'vi')?.title ||
            e.course.title,
          description:
            (e.course as any).translations?.find((item: any) => item.locale === locale)?.description ||
            (e.course as any).translations?.find((item: any) => item.locale === 'vi')?.description ||
            e.course.description,
        },
        progress: { totalLessons, completedLessons, percent },
      }
    })
  }

  async cancel(userId: number, courseId: number) {
    const access = await this.prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true },
    })
    if (!access) throw new NotFoundException('Course access not found')

    return this.prisma.courseAccess.update({
      where: { userId_courseId: { userId, courseId } },
      data: { status: CourseAccessStatus.CANCELED },
      select: { id: true, status: true, updatedAt: true },
    })
  }

  async assertEnrolledOrAdmin(user: JwtUser, courseId: number) {
    if (hasAnyPermission(user, ['courses.manage', 'courses.write', 'courses.publish'])) return

    const now = new Date()

    const access = await this.prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId: user.sub, courseId } },
      select: { status: true },
    })

    if (access?.status === CourseAccessStatus.ACTIVE) return

    const entitlements = await this.prisma.courseEntitlement.findMany({
      where: {
        userId: user.sub,
        courseId,
      },
      select: {
        sourceType: true,
        accessStartAt: true,
        accessEndAt: true,
      },
      take: 100,
    })

    if (!entitlements.length) {
      throw new ForbiddenException('Not enrolled')
    }

    const hasActivePermanentEntitlement = entitlements.some((row) => {
      if (row.sourceType === CourseEntitlementSourceType.PLAN_PASS) return false
      if (row.accessStartAt > now) return false
      if (row.accessEndAt && row.accessEndAt <= now) return false
      return true
    })

    if (hasActivePermanentEntitlement) return

    const hasPlanEntitlement = entitlements.some((row) => row.sourceType === CourseEntitlementSourceType.PLAN_PASS)
    if (!hasPlanEntitlement) {
      throw new ForbiddenException('Not enrolled')
    }

    const [course, activePasses, activePlans] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          price: true,
          tagLinks: {
            select: {
              tagId: true,
              tag: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      }),
      this.listCurrentPasses(user.sub, now),
      this.listActivePlansForUpgrade(),
    ])

    if (!course) throw new NotFoundException('Course not found')

    const decision = this.buildPlanAccessDecision(course, activePasses, activePlans)
    if (decision.canAccess) return

    throw new ForbiddenException(decision.blockedMessage || 'Not enrolled')
  }
}

