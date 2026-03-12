import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CourseEntitlementSourceType, Prisma, UserCoursePassEntitlementState, UserCoursePassStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AdminCreatePassDto } from './dto/admin-create-pass.dto'
import { AdminGrantEntitlementDto } from './dto/admin-grant-entitlement.dto'
import { AdminRenewPassDto } from './dto/admin-renew-pass.dto'
import { CreateCoursePlanDto } from './dto/create-course-plan.dto'
import { CreateCourseTagDto } from './dto/create-course-tag.dto'
import { ListAdminPassesDto } from './dto/list-admin-passes.dto'
import { PurchasePlanDto } from './dto/purchase-plan.dto'
import { SetCourseTagsDto } from './dto/set-course-tags.dto'
import { UnlockCourseDto } from './dto/unlock-course.dto'
import { UpdateCoursePlanDto } from './dto/update-course-plan.dto'
import { UpdateCourseTagDto } from './dto/update-course-tag.dto'

type PassWithPlan = Prisma.UserCoursePassGetPayload<{
  include: {
    plan: {
      include: {
        excludedTags: {
          include: {
            tag: true
          }
        }
      }
    }
    _count: {
      select: {
        unlockLogs: true
      }
    }
  }
}>

type UnlockableCourse = {
  id: number
  title: string
  price: number
  published: boolean
  tagLinks: Array<{
    tagId: number
    tag: {
      id: number
      code: string
      name: string
    }
  }>
}

@Injectable()
export class CoursePlansService {
  constructor(private readonly prisma: PrismaService) {}


  private normalizeTagCode(code: string) {
    return code.trim().toUpperCase().replace(/\s+/g, '_')
  }


  private parseDateInput(input?: string) {
    if (!input) return null
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date format')
    return d
  }


  private addDays(base: Date, days: number) {
    const out = new Date(base)
    out.setUTCDate(out.getUTCDate() + days)
    return out
  }

  private derivePassStatus(
    pass: {
      startAt: Date
      endAt: Date
      graceUntil: Date
      canceledAt: Date | null
      entitlementState?: UserCoursePassEntitlementState | null
    },
    now: Date,
  ): UserCoursePassStatus {
    if (pass.canceledAt) return UserCoursePassStatus.CANCELED
    const entitlementState = pass.entitlementState ?? UserCoursePassEntitlementState.CONFIRMED

    if (entitlementState === UserCoursePassEntitlementState.PENDING_CHARGE) {
      if (now < pass.graceUntil) return UserCoursePassStatus.SCHEDULED
      return UserCoursePassStatus.EXPIRED
    }

    if (now < pass.startAt) return UserCoursePassStatus.SCHEDULED
    if (now < pass.endAt) return UserCoursePassStatus.ACTIVE
    if (now < pass.graceUntil) return UserCoursePassStatus.GRACE
    return UserCoursePassStatus.EXPIRED
  }
  async reconcileUserPassStatuses(userId: number, nowInput?: Date) {
    const now = nowInput ? new Date(nowInput) : new Date()

    const passes = await this.prisma.userCoursePass.findMany({
      where: { userId },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        graceUntil: true,
        canceledAt: true,
        entitlementState: true,
        status: true,
      },
    })

    if (!passes.length) {
      return { syncedStatusCount: 0, forcedExpiredGraceCount: 0 }
    }

    const computedByPassId = new Map<number, UserCoursePassStatus>()
    let hasActivePass = false

    for (const pass of passes) {
      const computedStatus = this.derivePassStatus(pass, now)
      computedByPassId.set(pass.id, computedStatus)
      if (computedStatus === UserCoursePassStatus.ACTIVE) {
        hasActivePass = true
      }
    }

    const updates: Prisma.PrismaPromise<any>[] = []
    let syncedStatusCount = 0
    let forcedExpiredGraceCount = 0

    for (const pass of passes) {
      const computedStatus = computedByPassId.get(pass.id) ?? this.derivePassStatus(pass, now)

      // Business rule: once a new pass is active, no pass is allowed to remain in GRACE.
      if (hasActivePass && computedStatus === UserCoursePassStatus.GRACE) {
        const forcedGraceUntil = pass.graceUntil > now ? now : pass.graceUntil
        const needsUpdate =
          pass.status !== UserCoursePassStatus.EXPIRED || pass.graceUntil.getTime() !== forcedGraceUntil.getTime()

        if (needsUpdate) {
          updates.push(
            this.prisma.userCoursePass.updateMany({
              where: { id: pass.id },
              data: {
                graceUntil: forcedGraceUntil,
                status: UserCoursePassStatus.EXPIRED,
              },
            }),
          )
          syncedStatusCount += 1
          forcedExpiredGraceCount += 1
        }
        continue
      }

      if (pass.status !== computedStatus) {
        updates.push(
          this.prisma.userCoursePass.updateMany({
            where: { id: pass.id },
            data: { status: computedStatus },
          }),
        )
        syncedStatusCount += 1
      }
    }

    if (updates.length > 0) {
      await this.prisma.$transaction(updates)
    }

    return { syncedStatusCount, forcedExpiredGraceCount }
  }

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) throw new NotFoundException('User not found')
  }

  private async ensureCourseExists(courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) throw new NotFoundException('Course not found')
  }

  private async ensureTagsExist(tagIds: number[]) {
    if (!tagIds.length) return
    const found = await this.prisma.courseTag.count({ where: { id: { in: tagIds } } })
    if (found !== tagIds.length) throw new NotFoundException('One or more tags do not exist')
  }

  private async findPlanOrThrow(planId: number, opts?: { mustBeActive?: boolean }) {
    const plan = await this.prisma.coursePlan.findUnique({
      where: { id: planId },
      include: {
        excludedTags: {
          include: {
            tag: { select: { id: true, code: true, name: true } },
          },
          orderBy: { tagId: 'asc' },
        },
      },
    })

    if (!plan) throw new NotFoundException('Course plan not found')
    if (opts?.mustBeActive && !plan.isActive) throw new ForbiddenException('Course plan is not active')

    return plan
  }

  private mapPlan(plan: Prisma.CoursePlanGetPayload<{
    include: {
      excludedTags: {
        include: {
          tag: {
            select: {
              id: true
              code: true
              name: true
            }
          }
        }
      }
    }
  }>) {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      stripeProductId: plan.stripeProductId,
      currentStripePriceId: plan.currentStripePriceId,
      durationDays: plan.durationDays,
      graceDays: plan.graceDays,
      maxUnlocks: plan.maxUnlocks,
      maxCoursePrice: plan.maxCoursePrice,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      excludedTags: plan.excludedTags.map((row) => ({
        id: row.tag.id,
        code: row.tag.code,
        name: row.tag.name,
      })),
      excludedTagIds: plan.excludedTags.map((row) => row.tagId),
    }
  }

  private mapPass(pass: PassWithPlan, now: Date) {
    const computedStatus = this.derivePassStatus(pass, now)

    return {
      id: pass.id,
      userId: pass.userId,
      planId: pass.planId,
      purchaseId: pass.purchaseId,
      entitlementState: pass.entitlementState,
      startAt: pass.startAt,
      endAt: pass.endAt,
      graceUntil: pass.graceUntil,
      remainingUnlocks: pass.remainingUnlocks,
      status: pass.status,
      computedStatus,
      canceledAt: pass.canceledAt,
      createdAt: pass.createdAt,
      updatedAt: pass.updatedAt,
      unlockCount: pass._count.unlockLogs,
      canUnlockNew: (computedStatus === UserCoursePassStatus.ACTIVE || computedStatus === UserCoursePassStatus.GRACE) && pass.remainingUnlocks > 0,
      plan: this.mapPlan(pass.plan),
    }
  }

  private async createPassInstance(params: {
    userId: number
    planId: number
    purchaseId?: number
    entitlementState?: UserCoursePassEntitlementState
    startAt: Date
  }) {
    const plan = await this.findPlanOrThrow(params.planId)
    const endAt = this.addDays(params.startAt, plan.durationDays)
    const graceUntil = this.addDays(endAt, plan.graceDays)
    const now = new Date()

    const created = await this.prisma.userCoursePass.create({
      data: {
        userId: params.userId,
        planId: params.planId,
        purchaseId: params.purchaseId,
        entitlementState: params.entitlementState ?? UserCoursePassEntitlementState.CONFIRMED,
        startAt: params.startAt,
        endAt,
        graceUntil,
        remainingUnlocks: plan.maxUnlocks,
        status: this.derivePassStatus({
          entitlementState: params.entitlementState ?? UserCoursePassEntitlementState.CONFIRMED,
          startAt: params.startAt,
          endAt,
          graceUntil,
          canceledAt: null,
        }, now),
      },
      include: {
        plan: {
          include: {
            excludedTags: {
              include: { tag: { select: { id: true, code: true, name: true } } },
            },
          },
        },
        _count: { select: { unlockLogs: true } },
      },
    })

    if (created.status === UserCoursePassStatus.ACTIVE) {
      await this.reconcileUserPassStatuses(params.userId, now)
    }

    return created
  }

  async getAdminOverview() {
    const now = new Date()

    const [tagCount, plans, passRows] = await Promise.all([
      this.prisma.courseTag.count(),
      this.prisma.coursePlan.findMany({
        select: {
          id: true,
          isActive: true,
        },
      }),
      this.prisma.userCoursePass.findMany({
        select: {
          userId: true,
          remainingUnlocks: true,
          startAt: true,
          endAt: true,
          graceUntil: true,
          canceledAt: true,
          entitlementState: true,
          plan: {
            select: {
              maxUnlocks: true,
            },
          },
        },
      }),
    ])

    let activePassCount = 0
    let gracePassCount = 0
    let totalQuota = 0
    let usedQuota = 0
    let remainingQuota = 0
    const subscriberSet = new Set<number>()

    for (const pass of passRows) {
      const computedStatus = this.derivePassStatus(pass, now)
      if (computedStatus === UserCoursePassStatus.ACTIVE) activePassCount += 1
      if (computedStatus === UserCoursePassStatus.GRACE) gracePassCount += 1
      if (computedStatus === UserCoursePassStatus.ACTIVE || computedStatus === UserCoursePassStatus.GRACE) {
        subscriberSet.add(pass.userId)
      }

      totalQuota += pass.plan.maxUnlocks
      usedQuota += Math.max(0, pass.plan.maxUnlocks - pass.remainingUnlocks)
      remainingQuota += pass.remainingUnlocks
    }

    return {
      tagCount,
      planCount: plans.length,
      activePlanCount: plans.filter((item) => item.isActive).length,
      passCount: passRows.length,
      activePassCount,
      gracePassCount,
      subscriberCount: subscriberSet.size,
      totalQuota,
      usedQuota,
      remainingQuota,
    }
  }
  async listTags() {
    return this.prisma.courseTag.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            courseLinks: true,
            excludedInPlans: true,
          },
        },
      },
      orderBy: [{ id: 'desc' }],
    })
  }

  async createTag(dto: CreateCourseTagDto) {
    return this.prisma.courseTag.create({
      data: {
        code: this.normalizeTagCode(dto.code),
        name: dto.name.trim(),
      },
    })
  }

  async updateTag(id: number, dto: UpdateCourseTagDto) {
    await this.prisma.courseTag.findUniqueOrThrow({ where: { id }, select: { id: true } })

    return this.prisma.courseTag.update({
      where: { id },
      data: {
        ...(dto.code !== undefined ? { code: this.normalizeTagCode(dto.code) } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      },
    })
  }

  async deleteTag(id: number) {
    try {
      return await this.prisma.courseTag.delete({ where: { id }, select: { id: true } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Tag is being used by courses or plans')
      }
      throw error
    }
  }

  async setCourseTags(courseId: number, dto: SetCourseTagsDto) {
    await this.ensureCourseExists(courseId)

    const tagIds = Array.from(new Set((dto.tagIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)))
    await this.ensureTagsExist(tagIds)

    await this.prisma.$transaction(async (tx) => {
      await tx.courseTagLink.deleteMany({ where: { courseId } })
      if (tagIds.length > 0) {
        await tx.courseTagLink.createMany({
          data: tagIds.map((tagId) => ({ courseId, tagId })),
          skipDuplicates: true,
        })
      }
    })

    return this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        tagLinks: {
          select: {
            tagId: true,
            tag: { select: { id: true, code: true, name: true } },
          },
          orderBy: { tagId: 'asc' },
        },
      },
    })
  }

  async listPlans(opts?: { includeInactive?: boolean }) {
    const plans = await this.prisma.coursePlan.findMany({
      where: {
        ...(opts?.includeInactive ? {} : { isActive: true }),
      },
      include: {
        excludedTags: {
          include: {
            tag: { select: { id: true, code: true, name: true } },
          },
          orderBy: { tagId: 'asc' },
        },
      },
      orderBy: [{ id: 'desc' }],
    })

    return plans.map((plan) => this.mapPlan(plan))
  }

  async getPlanById(planId: number, opts?: { mustBeActive?: boolean }) {
    const plan = await this.findPlanOrThrow(planId, opts)
    return this.mapPlan(plan)
  }

  async createPlan(dto: CreateCoursePlanDto) {
    const excludedTagIds = Array.from(new Set(dto.excludedTagIds || []))
    await this.ensureTagsExist(excludedTagIds)

    const plan = await this.prisma.coursePlan.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        price: dto.price,
        currency: (dto.currency ?? 'vnd').toLowerCase(),
        billingInterval: dto.billingInterval ?? 'month',
        ...(dto.stripeProductId !== undefined ? { stripeProductId: dto.stripeProductId.trim() || null } : {}),
        ...(dto.currentStripePriceId !== undefined
          ? { currentStripePriceId: dto.currentStripePriceId.trim() || null }
          : {}),
        durationDays: dto.durationDays,
        graceDays: dto.graceDays,
        maxUnlocks: dto.maxUnlocks,
        ...(dto.maxCoursePrice !== undefined ? { maxCoursePrice: dto.maxCoursePrice } : {}),
        isActive: dto.isActive ?? true,
        ...(excludedTagIds.length
          ? {
              excludedTags: {
                create: excludedTagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: {
        excludedTags: {
          include: {
            tag: { select: { id: true, code: true, name: true } },
          },
          orderBy: { tagId: 'asc' },
        },
      },
    })

    return this.mapPlan(plan)
  }

  async updatePlan(planId: number, dto: UpdateCoursePlanDto) {
    await this.findPlanOrThrow(planId)

    const baseData: Prisma.CoursePlanUpdateInput = {
      ...(dto.code !== undefined ? { code: dto.code.trim().toUpperCase() } : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency.toLowerCase() } : {}),
      ...(dto.billingInterval !== undefined ? { billingInterval: dto.billingInterval } : {}),
      ...(dto.stripeProductId !== undefined ? { stripeProductId: dto.stripeProductId.trim() || null } : {}),
      ...(dto.currentStripePriceId !== undefined
        ? { currentStripePriceId: dto.currentStripePriceId.trim() || null }
        : {}),
      ...(dto.durationDays !== undefined ? { durationDays: dto.durationDays } : {}),
      ...(dto.graceDays !== undefined ? { graceDays: dto.graceDays } : {}),
      ...(dto.maxUnlocks !== undefined ? { maxUnlocks: dto.maxUnlocks } : {}),
      ...(dto.maxCoursePrice !== undefined ? { maxCoursePrice: dto.maxCoursePrice } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    }

    if (dto.excludedTagIds === undefined) {
      const plan = await this.prisma.coursePlan.update({
        where: { id: planId },
        data: baseData,
        include: {
          excludedTags: {
            include: {
              tag: { select: { id: true, code: true, name: true } },
            },
            orderBy: { tagId: 'asc' },
          },
        },
      })
      return this.mapPlan(plan)
    }

    const excludedTagIds = Array.from(new Set(dto.excludedTagIds || []))
    await this.ensureTagsExist(excludedTagIds)

    const plan = await this.prisma.$transaction(async (tx) => {
      await tx.coursePlan.update({ where: { id: planId }, data: baseData })
      await tx.coursePlanExcludedTag.deleteMany({ where: { planId } })
      if (excludedTagIds.length) {
        await tx.coursePlanExcludedTag.createMany({
          data: excludedTagIds.map((tagId) => ({ planId, tagId })),
          skipDuplicates: true,
        })
      }

      return tx.coursePlan.findUniqueOrThrow({
        where: { id: planId },
        include: {
          excludedTags: {
            include: {
              tag: { select: { id: true, code: true, name: true } },
            },
            orderBy: { tagId: 'asc' },
          },
        },
      })
    })

    return this.mapPlan(plan)
  }

  async deletePlan(planId: number) {
    try {
      return await this.prisma.coursePlan.delete({ where: { id: planId }, select: { id: true } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Plan already has purchased passes and cannot be deleted')
      }
      throw error
    }
  }

  async listAdminPasses(query: ListAdminPassesDto) {
    const now = new Date()

    const rows = await this.prisma.userCoursePass.findMany({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.planId ? { planId: query.planId } : {}),
      },
      include: {
        plan: {
          include: {
            excludedTags: {
              include: { tag: { select: { id: true, code: true, name: true } } },
            },
          },
        },
        _count: { select: { unlockLogs: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })

    const mapped = rows.map((row) => this.mapPass(row, now))
    if (!query.status) return mapped
    return mapped.filter((row) => row.computedStatus === query.status)
  }

  async createPass(dto: AdminCreatePassDto) {
    await this.ensureUserExists(dto.userId)
    await this.findPlanOrThrow(dto.planId)

    const startAt = this.parseDateInput(dto.startAt) ?? new Date()
    const created = await this.createPassInstance({
      userId: dto.userId,
      planId: dto.planId,
      purchaseId: dto.purchaseId,
      startAt,
    })

    return this.mapPass(created, new Date())
  }

  async renewPass(passId: number, dto: AdminRenewPassDto) {
    const now = this.parseDateInput(dto.renewAt) ?? new Date()

    const oldPass = await this.prisma.userCoursePass.findUnique({
      where: { id: passId },
      select: {
        id: true,
        userId: true,
        planId: true,
        endAt: true,
        graceUntil: true,
        canceledAt: true,
      },
    })

    if (!oldPass) throw new NotFoundException('Pass not found')
    if (oldPass.canceledAt) throw new BadRequestException('Canceled pass cannot be renewed')

    const newStart = now < oldPass.graceUntil ? oldPass.endAt : now

    const created = await this.createPassInstance({
      userId: oldPass.userId,
      planId: oldPass.planId,
      purchaseId: dto.purchaseId,
      startAt: newStart,
    })

    return this.mapPass(created, now)
  }

  async cancelPass(passId: number) {
    const pass = await this.prisma.userCoursePass.findUnique({ where: { id: passId }, select: { id: true } })
    if (!pass) throw new NotFoundException('Pass not found')

    return this.prisma.userCoursePass.update({
      where: { id: passId },
      data: {
        canceledAt: new Date(),
        status: UserCoursePassStatus.CANCELED,
      },
      select: {
        id: true,
        canceledAt: true,
        status: true,
        updatedAt: true,
      },
    })
  }

  async purchasePlan(userId: number, planId: number, dto: PurchasePlanDto) {
    await this.ensureUserExists(userId)
    await this.findPlanOrThrow(planId, { mustBeActive: true })

    const now = new Date()
    const existingScheduled = await this.prisma.userCoursePass.findFirst({
      where: {
        userId,
        canceledAt: null,
        startAt: { gt: now },
      },
      select: { id: true },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
    })

    if (existingScheduled) {
      throw new BadRequestException('You already have a scheduled pass for the next cycle')
    }

    const latest = await this.prisma.userCoursePass.findFirst({
      where: { userId, canceledAt: null },
      select: { endAt: true, graceUntil: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })

    const startAt = latest && now < latest.graceUntil ? latest.endAt : now

    const created = await this.createPassInstance({
      userId,
      planId,
      purchaseId: dto.purchaseId,
      startAt,
    })

    return this.mapPass(created, now)
  }

  async listMyPasses(userId: number) {
    const now = new Date()
    await this.reconcileUserPassStatuses(userId, now)

    const rows = await this.prisma.userCoursePass.findMany({
      where: { userId },
      include: {
        plan: {
          include: {
            excludedTags: {
              include: {
                tag: { select: { id: true, code: true, name: true } },
              },
              orderBy: { tagId: 'asc' },
            },
          },
        },
        _count: { select: { unlockLogs: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    })

    return rows.map((row) => this.mapPass(row, now))
  }

  async listMyEntitlements(userId: number, opts?: { includeExpired?: boolean }) {
    const now = new Date()
    const rows = await this.prisma.courseEntitlement.findMany({
      where: {
        userId,
        ...(opts?.includeExpired
          ? {}
          : {
              accessStartAt: { lte: now },
              OR: [{ accessEndAt: null }, { accessEndAt: { gt: now } }],
            }),
      },
      select: {
        id: true,
        courseId: true,
        sourceType: true,
        sourceId: true,
        accessStartAt: true,
        accessEndAt: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            published: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 300,
    })

    return rows.map((row) => ({
      ...row,
      isActive: row.accessStartAt <= now && (!row.accessEndAt || row.accessEndAt > now),
    }))
  }

  private evaluatePassEligibilityForCourse(
    pass: {
      plan: {
        maxCoursePrice: number | null
        excludedTags: Array<{ tagId: number; tag: { code: string } }>
      }
    },
    course: UnlockableCourse,
  ) {
    if (pass.plan.maxCoursePrice !== null && course.price > pass.plan.maxCoursePrice) {
      return {
        eligible: false as const,
        reason: 'PRICE_LIMIT' as const,
        blockedTags: [] as string[],
      }
    }

    const excludedTagIdSet = new Set(pass.plan.excludedTags.map((item) => item.tagId))
    const blockedTags = course.tagLinks
      .filter((item) => excludedTagIdSet.has(item.tagId))
      .map((item) => item.tag.code)

    if (blockedTags.length > 0) {
      return {
        eligible: false as const,
        reason: 'EXCLUDED_TAG' as const,
        blockedTags,
      }
    }

    return {
      eligible: true as const,
      reason: 'OK' as const,
      blockedTags: [] as string[],
    }
  }

  private async resolvePassForUnlock(userId: number, now: Date, course: UnlockableCourse, passId?: number) {
    const whereBase = {
      include: {
        plan: {
          include: {
            excludedTags: {
              include: {
                tag: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
        _count: { select: { unlockLogs: true } },
      },
    } as const

    if (passId) {
      const pass = await this.prisma.userCoursePass.findUnique({
        where: { id: passId },
        ...whereBase,
      })

      if (!pass) throw new ForbiddenException('No active pass found')
      if (pass.userId !== userId) throw new ForbiddenException('Pass does not belong to current user')

      const status = this.derivePassStatus(pass, now)
      if (status !== UserCoursePassStatus.ACTIVE && status !== UserCoursePassStatus.GRACE) {
        throw new ForbiddenException('Pass is no longer valid for new unlock')
      }

      if (!pass.plan.isActive) {
        throw new ForbiddenException('Plan is disabled')
      }

      if (pass.remainingUnlocks <= 0) {
        throw new ForbiddenException('No remaining unlocks on this pass')
      }

      const eligibility = this.evaluatePassEligibilityForCourse(pass, course)
      if (!eligibility.eligible) {
        if (eligibility.reason === 'PRICE_LIMIT') {
          throw new ForbiddenException('Course price exceeds plan limit')
        }
        throw new ForbiddenException(`Course contains blocked tags: ${eligibility.blockedTags.join(', ')}`)
      }

      return pass
    }

    const candidates = await this.prisma.userCoursePass.findMany({
      where: {
        userId,
        canceledAt: null,
        startAt: { lte: now },
        graceUntil: { gt: now },
        entitlementState: UserCoursePassEntitlementState.CONFIRMED,
        remainingUnlocks: { gt: 0 },
      },
      orderBy: [{ graceUntil: 'asc' }, { endAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      ...whereBase,
    })

    const activeCandidates = candidates.filter((item) => item.plan.isActive)
    const eligibleCandidate = activeCandidates.find((item) => this.evaluatePassEligibilityForCourse(item, course).eligible)

    if (eligibleCandidate) return eligibleCandidate

    if (activeCandidates.length === 0) {
      const activePassCount = await this.prisma.userCoursePass.count({
        where: {
          userId,
          canceledAt: null,
          startAt: { lte: now },
          graceUntil: { gt: now },
          entitlementState: UserCoursePassEntitlementState.CONFIRMED,
        },
      })
      if (activePassCount > 0) {
        throw new ForbiddenException('No remaining unlocks on current passes')
      }
      throw new ForbiddenException('No active pass found')
    }

    throw new ForbiddenException('No current pass is eligible for this course')
  }

  async unlockCourse(userId: number, courseId: number, dto: UnlockCourseDto) {
    const now = new Date()

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        published: true,
        tagLinks: {
          select: {
            tagId: true,
            tag: { select: { id: true, code: true, name: true } },
          },
        },
      },
    })

    if (!course) throw new NotFoundException('Course not found')
    if (!course.published) throw new ForbiddenException('Course is not published')

    const permanentEntitlement = await this.prisma.courseEntitlement.findFirst({
      where: {
        userId,
        courseId,
        sourceType: {
          in: [CourseEntitlementSourceType.SINGLE_PURCHASE, CourseEntitlementSourceType.ADMIN_GRANT],
        },
        accessStartAt: { lte: now },
        OR: [{ accessEndAt: null }, { accessEndAt: { gt: now } }],
      },
      select: {
        id: true,
        sourceType: true,
        sourceId: true,
        accessStartAt: true,
        accessEndAt: true,
      },
    })

    if (permanentEntitlement) {
      return {
        unlocked: true,
        alreadyEntitled: true,
        entitlement: permanentEntitlement,
      }
    }

    const pass = await this.resolvePassForUnlock(userId, now, course, dto.passId)

    if (pass.remainingUnlocks <= 0) {
      throw new ForbiddenException('No remaining unlocks on this pass')
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.planUnlockLog.create({
          data: {
            passId: pass.id,
            userId,
            courseId,
          },
        })

        const updated = await tx.userCoursePass.updateMany({
          where: {
            id: pass.id,
            remainingUnlocks: { gt: 0 },
          },
          data: {
            remainingUnlocks: { decrement: 1 },
          },
        })

        if (updated.count === 0) {
          throw new ForbiddenException('No remaining unlocks on this pass')
        }

        const entitlement = await tx.courseEntitlement.upsert({
          where: {
            userId_courseId_sourceType_sourceId: {
              userId,
              courseId,
              sourceType: CourseEntitlementSourceType.PLAN_PASS,
              sourceId: pass.id,
            },
          },
          update: {
            accessStartAt: now,
            accessEndAt: pass.graceUntil,
          },
          create: {
            userId,
            courseId,
            sourceType: CourseEntitlementSourceType.PLAN_PASS,
            sourceId: pass.id,
            accessStartAt: now,
            accessEndAt: pass.graceUntil,
          },
        })

        const refreshedPass = await tx.userCoursePass.findUniqueOrThrow({
          where: { id: pass.id },
          include: {
            plan: {
              include: {
                excludedTags: {
                  include: { tag: { select: { id: true, code: true, name: true } } },
                },
              },
            },
            _count: { select: { unlockLogs: true } },
          },
        })

        return {
          entitlement,
          pass: refreshedPass,
        }
      })

      return {
        unlocked: true,
        entitlement: result.entitlement,
        pass: this.mapPass(result.pass, now),
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existingEntitlement = await this.prisma.courseEntitlement.findFirst({
          where: {
            userId,
            courseId,
            sourceType: CourseEntitlementSourceType.PLAN_PASS,
            sourceId: pass.id,
          },
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            accessStartAt: true,
            accessEndAt: true,
          },
        })

        const refreshedPass = await this.prisma.userCoursePass.findUniqueOrThrow({
          where: { id: pass.id },
          include: {
            plan: {
              include: {
                excludedTags: {
                  include: { tag: { select: { id: true, code: true, name: true } } },
                },
              },
            },
            _count: { select: { unlockLogs: true } },
          },
        })

        return {
          unlocked: true,
          alreadyUnlocked: true,
          entitlement: existingEntitlement,
          pass: this.mapPass(refreshedPass, now),
        }
      }

      throw error
    }
  }

  async grantAdminEntitlement(actorUserId: number, dto: AdminGrantEntitlementDto) {
    await this.ensureUserExists(dto.userId)
    await this.ensureCourseExists(dto.courseId)

    const sourceId = dto.sourceId ?? actorUserId
    const accessEndAt = this.parseDateInput(dto.accessEndAt)

    return this.prisma.courseEntitlement.upsert({
      where: {
        userId_courseId_sourceType_sourceId: {
          userId: dto.userId,
          courseId: dto.courseId,
          sourceType: CourseEntitlementSourceType.ADMIN_GRANT,
          sourceId,
        },
      },
      update: {
        accessStartAt: new Date(),
        accessEndAt,
      },
      create: {
        userId: dto.userId,
        courseId: dto.courseId,
        sourceType: CourseEntitlementSourceType.ADMIN_GRANT,
        sourceId,
        accessStartAt: new Date(),
        accessEndAt,
      },
    })
  }
}

