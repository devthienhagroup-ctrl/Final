import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CoursePlanPaymentStatus, Prisma, UserCoursePassStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CoursePlansService } from './course-plans.service'

type CoursePlanPaymentWithPlan = Prisma.CoursePlanPaymentGetPayload<{
  include: {
    plan: {
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
    }
  }
}>

@Injectable()
export class CoursePlanPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: CoursePlansService,
  ) {}

  private readonly bankInfo = {
    gateway: 'BIDV',
    accountNumber: '8810091561',
    accountName: 'LE MINH HIEU',
  }

  private normalizeStatus(status: CoursePlanPaymentStatus, expiredAt: Date | null, now: Date): CoursePlanPaymentStatus {
    if (status === CoursePlanPaymentStatus.PENDING && expiredAt && expiredAt <= now) {
      return CoursePlanPaymentStatus.EXPIRED
    }
    return status
  }

  private addMinutes(base: Date, minutes: number) {
    const out = new Date(base)
    out.setTime(out.getTime() + minutes * 60_000)
    return out
  }

  private addDays(base: Date, days: number) {
    const out = new Date(base)
    out.setUTCDate(out.getUTCDate() + days)
    return out
  }

  private derivePassStatus(
    pass: { startAt: Date; endAt: Date; graceUntil: Date; canceledAt: Date | null },
    now: Date,
  ): UserCoursePassStatus {
    if (pass.canceledAt) return UserCoursePassStatus.CANCELED
    if (now < pass.startAt) return UserCoursePassStatus.ACTIVE
    if (now < pass.endAt) return UserCoursePassStatus.ACTIVE
    if (now < pass.graceUntil) return UserCoursePassStatus.GRACE
    return UserCoursePassStatus.EXPIRED
  }

  private genTransferCode() {
    return `PLAN_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }

  private buildTransferContent(paymentId: number) {
    return `ID${paymentId}CoursePlanPayment`
  }

  parseTransferContent(content?: string | null): number | null {
    if (!content) return null
    const matched = content.match(/ID(\d+)CoursePlanPayment/i)
    if (!matched?.[1]) return null

    const paymentId = Number(matched[1])
    if (!Number.isInteger(paymentId) || paymentId <= 0) return null
    return paymentId
  }

  private mapPlan(plan: CoursePlanPaymentWithPlan['plan']) {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      graceDays: plan.graceDays,
      maxUnlocks: plan.maxUnlocks,
      maxCoursePrice: plan.maxCoursePrice,
      isActive: plan.isActive,
      excludedTags: plan.excludedTags.map((row) => ({
        id: row.tag.id,
        code: row.tag.code,
        name: row.tag.name,
      })),
      excludedTagIds: plan.excludedTags.map((row) => row.tagId),
    }
  }

  private mapPassSummary(pass?: {
    id: number
    planId: number
    purchaseId: number | null
    startAt: Date
    endAt: Date
    graceUntil: Date
    remainingUnlocks: number
    status: UserCoursePassStatus
    canceledAt: Date | null
    createdAt: Date
  }) {
    if (!pass) return null

    const now = new Date()
    const computedStatus = this.derivePassStatus(
      {
        startAt: pass.startAt,
        endAt: pass.endAt,
        graceUntil: pass.graceUntil,
        canceledAt: pass.canceledAt,
      },
      now,
    )

    return {
      id: pass.id,
      planId: pass.planId,
      purchaseId: pass.purchaseId,
      startAt: pass.startAt,
      endAt: pass.endAt,
      graceUntil: pass.graceUntil,
      remainingUnlocks: pass.remainingUnlocks,
      status: pass.status,
      computedStatus,
      canceledAt: pass.canceledAt,
      createdAt: pass.createdAt,
    }
  }

  private mapPayment(
    payment: CoursePlanPaymentWithPlan,
    now: Date,
    pass?: {
      id: number
      planId: number
      purchaseId: number | null
      startAt: Date
      endAt: Date
      graceUntil: Date
      remainingUnlocks: number
      status: UserCoursePassStatus
      canceledAt: Date | null
      createdAt: Date
    },
  ) {
    const status = this.normalizeStatus(payment.status, payment.expiredAt, now)
    const sepay = status === CoursePlanPaymentStatus.PENDING
      ? {
          webhookUrl: '/hooks/sepay-payment',
          amount: payment.amount,
          accountName: this.bankInfo.accountName,
          accountNumber: this.bankInfo.accountNumber,
          bankName: this.bankInfo.gateway,
          bankCode: this.bankInfo.gateway,
          transferContent: payment.transferContent,
          qrUrl: `https://qr.sepay.vn/img?acc=${this.bankInfo.accountNumber}&bank=${this.bankInfo.gateway}&des=${payment.transferContent}&amount=${payment.amount}`,
          expiresAt: payment.expiredAt,
        }
      : null

    return {
      id: payment.id,
      userId: payment.userId,
      planId: payment.planId,
      provider: payment.provider,
      status: payment.status,
      computedStatus: status,
      amount: payment.amount,
      transferCode: payment.transferCode,
      transferContent: payment.transferContent,
      paidAt: payment.paidAt,
      expiredAt: payment.expiredAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      plan: this.mapPlan(payment.plan),
      pass: this.mapPassSummary(pass),
      sepay,
    }
  }

  private async getActivePlanOrThrow(planId: number) {
    const plan = await this.prisma.coursePlan.findUnique({
      where: { id: planId },
      include: {
        excludedTags: {
          include: {
            tag: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
          orderBy: { tagId: 'asc' },
        },
      },
    })

    if (!plan) throw new NotFoundException('Course plan not found')
    if (!plan.isActive) throw new ForbiddenException('Course plan is not active')

    return plan
  }

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) throw new NotFoundException('User not found')
  }

  private async markExpiredPendingPayments(userId: number, planId?: number) {
    const now = new Date()

    await this.prisma.coursePlanPayment.updateMany({
      where: {
        userId,
        status: CoursePlanPaymentStatus.PENDING,
        expiredAt: { lte: now },
        ...(planId ? { planId } : {}),
      },
      data: {
        status: CoursePlanPaymentStatus.EXPIRED,
      },
    })
  }

  async createCheckout(userId: number, planId: number) {
    await this.ensureUserExists(userId)
    const plan = await this.getActivePlanOrThrow(planId)

    if ((plan.price ?? 0) <= 0) {
      const pass = await this.plans.purchasePlan(userId, planId, {})
      return {
        mode: 'FREE' as const,
        pass,
      }
    }

    await this.markExpiredPendingPayments(userId, planId)

    const now = new Date()

    const existingPending = await this.prisma.coursePlanPayment.findFirst({
      where: {
        userId,
        planId,
        status: CoursePlanPaymentStatus.PENDING,
        OR: [{ expiredAt: null }, { expiredAt: { gt: now } }],
      },
      include: {
        plan: {
          include: {
            excludedTags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
              orderBy: { tagId: 'asc' },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })

    if (existingPending) {
      return {
        mode: 'SEPAY' as const,
        payment: this.mapPayment(existingPending, now),
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.coursePlanPayment.create({
        data: {
          userId,
          planId,
          provider: 'SEPAY',
          status: CoursePlanPaymentStatus.PENDING,
          amount: plan.price,
          transferCode: this.genTransferCode(),
          transferContent: `TMP-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          expiredAt: this.addMinutes(now, 15),
          rawResponse: {
            accountName: this.bankInfo.accountName,
            accountNumber: this.bankInfo.accountNumber,
            bankName: this.bankInfo.gateway,
            bankCode: this.bankInfo.gateway,
          },
        },
      })

      const finalTransferContent = this.buildTransferContent(payment.id)

      return tx.coursePlanPayment.update({
        where: { id: payment.id },
        data: {
          transferContent: finalTransferContent,
          rawResponse: {
            accountName: this.bankInfo.accountName,
            accountNumber: this.bankInfo.accountNumber,
            bankName: this.bankInfo.gateway,
            bankCode: this.bankInfo.gateway,
            transferContent: finalTransferContent,
          },
        },
        include: {
          plan: {
            include: {
              excludedTags: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                },
                orderBy: { tagId: 'asc' },
              },
            },
          },
        },
      })
    })

    return {
      mode: 'SEPAY' as const,
      payment: this.mapPayment(created, now),
    }
  }

  async listMyPayments(userId: number) {
    await this.markExpiredPendingPayments(userId)

    const now = new Date()

    const rows = await this.prisma.coursePlanPayment.findMany({
      where: { userId },
      include: {
        plan: {
          include: {
            excludedTags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
              orderBy: { tagId: 'asc' },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 200,
    })

    const purchaseIds = rows.map((row) => row.id)
    const passRows = purchaseIds.length > 0
      ? await this.prisma.userCoursePass.findMany({
          where: {
            userId,
            purchaseId: {
              in: purchaseIds,
            },
          },
          select: {
            id: true,
            planId: true,
            purchaseId: true,
            startAt: true,
            endAt: true,
            graceUntil: true,
            remainingUnlocks: true,
            status: true,
            canceledAt: true,
            createdAt: true,
          },
        })
      : []

    const passByPurchaseId = new Map<number, (typeof passRows)[number]>()
    for (const pass of passRows) {
      if (typeof pass.purchaseId === 'number') {
        passByPurchaseId.set(pass.purchaseId, pass)
      }
    }

    return rows.map((row) => this.mapPayment(row, now, passByPurchaseId.get(row.id)))
  }

  async handleSepayWebhook(payload: any, paymentId: number) {
    const payment = await this.prisma.coursePlanPayment.findUnique({
      where: { id: paymentId },
      include: {
        plan: {
          include: {
            excludedTags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
              orderBy: { tagId: 'asc' },
            },
          },
        },
      },
    })

    if (!payment) throw new NotFoundException('Course plan payment not found')

    if (payment.transferContent !== this.buildTransferContent(payment.id)) {
      throw new ForbiddenException('Invalid transfer content for course plan payment')
    }

    if (payment.status === CoursePlanPaymentStatus.PAID) {
      return {
        ok: true,
        alreadyPaid: true,
        paymentId: payment.id,
      }
    }

    if (payment.status !== CoursePlanPaymentStatus.PENDING) {
      return {
        ok: true,
        ignored: true,
        status: payment.status,
        paymentId: payment.id,
      }
    }

    const now = new Date()

    if (payment.expiredAt && payment.expiredAt <= now) {
      await this.prisma.coursePlanPayment.updateMany({
        where: { id: payment.id, status: CoursePlanPaymentStatus.PENDING },
        data: {
          status: CoursePlanPaymentStatus.EXPIRED,
          rawResponse: payload,
        },
      })

      return {
        ok: true,
        ignored: true,
        expired: true,
        paymentId: payment.id,
      }
    }

    const transferAmount = Number(payload?.transferAmount ?? 0)
    if (!Number.isFinite(transferAmount) || transferAmount < payment.amount) {
      throw new ForbiddenException('Transfer amount is not enough for this course plan payment')
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.coursePlanPayment.updateMany({
        where: {
          id: payment.id,
          status: CoursePlanPaymentStatus.PENDING,
        },
        data: {
          status: CoursePlanPaymentStatus.PAID,
          paidAt: now,
          rawResponse: payload,
        },
      })

      if (updatedPayment.count === 0) {
        return {
          alreadyPaid: true,
        }
      }

      const existingPass = await tx.userCoursePass.findFirst({
        where: {
          userId: payment.userId,
          planId: payment.planId,
          purchaseId: payment.id,
        },
        select: {
          id: true,
        },
      })

      if (existingPass) {
        return {
          alreadyPaid: false,
          passId: existingPass.id,
        }
      }

      const latest = await tx.userCoursePass.findFirst({
        where: {
          userId: payment.userId,
          planId: payment.planId,
          canceledAt: null,
        },
        select: {
          endAt: true,
          graceUntil: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      })

      const startAt = latest && now < latest.graceUntil ? latest.endAt : now
      const endAt = this.addDays(startAt, payment.plan.durationDays)
      const graceUntil = this.addDays(endAt, payment.plan.graceDays)

      const createdPass = await tx.userCoursePass.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          purchaseId: payment.id,
          startAt,
          endAt,
          graceUntil,
          remainingUnlocks: payment.plan.maxUnlocks,
          status: this.derivePassStatus(
            {
              startAt,
              endAt,
              graceUntil,
              canceledAt: null,
            },
            now,
          ),
        },
        select: {
          id: true,
        },
      })

      return {
        alreadyPaid: false,
        passId: createdPass.id,
      }
    })

    return {
      ok: true,
      paymentId: payment.id,
      ...(result.alreadyPaid ? { alreadyPaid: true } : {}),
      ...(!result.alreadyPaid ? { passId: result.passId } : {}),
      message: 'Course plan payment successful',
    }
  }
}
