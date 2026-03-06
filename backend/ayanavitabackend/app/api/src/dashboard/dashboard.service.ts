import { Injectable } from '@nestjs/common'
import {
  CoursePlanPaymentStatus,
  OrderStatus,
  ProductOrderStatus,
  ProductPaymentMethod,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

type DashboardRange = 7 | 30 | 90

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getRangeStart(rangeDays: number) {
    const today = new Date()
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - Math.max(1, rangeDays) + 1)
    return start
  }

  private parseRange(rawRange?: string): DashboardRange {
    const n = Number(rawRange)
    if (n === 7 || n === 30 || n === 90) return n
    return 30
  }

  private toDayKey(date: Date) {
    const y = date.getFullYear()
    const m = `${date.getMonth() + 1}`.padStart(2, '0')
    const d = `${date.getDate()}`.padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  private addMapValue(map: Map<string, number>, key: string, value: number) {
    map.set(key, (map.get(key) ?? 0) + value)
  }

  private toVndNumber(value: unknown) {
    return Number(value ?? 0)
  }

  async getStats(rawRange?: string) {
    const rangeDays = this.parseRange(rawRange)
    const startDate = this.getRangeStart(rangeDays)
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - rangeDays)

    const currentDateFilter = [
      { paidAt: { gte: startDate } },
      { paidAt: null, createdAt: { gte: startDate } },
    ]
    const previousDateFilter = [
      { paidAt: { gte: prevStartDate, lt: startDate } },
      { paidAt: null, createdAt: { gte: prevStartDate, lt: startDate } },
    ]

    const [
      courseOrdersCurrent,
      productOrdersCurrent,
      packagePaymentsCurrent,
      courseOrdersPrev,
      productOrdersPrev,
      packagePaymentsPrev,
      newStudents,
      lessonProgressCount,
      completedCount,
      topCourses,
      recentOrders,
      studentsProgress,
      revenueByCategory,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: OrderStatus.PAID,
          OR: currentDateFilter,
        },
        select: {
          total: true,
          createdAt: true,
          paidAt: true,
        },
      }),

      this.prisma.productOrder.findMany({
        where: {
          status: ProductOrderStatus.SUCCESS,
          OR: currentDateFilter,
        },
        select: {
          total: true,
          paymentMethod: true,
          createdAt: true,
          paidAt: true,
        },
      }),

      this.prisma.coursePlanPayment.findMany({
        where: {
          status: CoursePlanPaymentStatus.PAID,
          OR: currentDateFilter,
        },
        select: {
          amount: true,
          planId: true,
          createdAt: true,
          paidAt: true,
        },
      }),

      this.prisma.order.findMany({
        where: {
          status: OrderStatus.PAID,
          OR: previousDateFilter,
        },
        select: { total: true },
      }),

      this.prisma.productOrder.findMany({
        where: {
          status: ProductOrderStatus.SUCCESS,
          OR: previousDateFilter,
        },
        select: { total: true },
      }),

      this.prisma.coursePlanPayment.findMany({
        where: {
          status: CoursePlanPaymentStatus.PAID,
          OR: previousDateFilter,
        },
        select: { amount: true },
      }),

      this.prisma.user.count({ where: { createdAt: { gte: startDate } } }),

      this.prisma.lessonProgress.count({ where: { updatedAt: { gte: startDate } } }),

      this.prisma.lessonProgress.count({
        where: {
          status: 'COMPLETED',
          completedAt: { not: null },
          updatedAt: { gte: startDate },
        },
      }),

      this.prisma.orderItem.groupBy({
        by: ['courseId'],
        _sum: { price: true },
        _count: { _all: true },
        where: {
          order: {
            status: OrderStatus.PAID,
            OR: currentDateFilter,
          },
        },
        orderBy: { _sum: { price: 'desc' } },
        take: 4,
      }),

      this.prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          code: true,
          total: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          items: { take: 1, select: { courseTitle: true } },
        },
      }),

      this.prisma.lessonProgress.findMany({
        where: { updatedAt: { gte: startDate } },
        orderBy: { updatedAt: 'desc' },
        distinct: ['userId'],
        take: 6,
        select: {
          percent: true,
          user: { select: { name: true, email: true } },
          lesson: { select: { course: { select: { title: true } } } },
        },
      }),

      this.prisma.productOrderDetail.groupBy({
        by: ['productId'],
        _sum: { lineTotal: true },
        where: {
          order: {
            status: ProductOrderStatus.SUCCESS,
            OR: currentDateFilter,
          },
        },
      }),
    ])

    const currentCourseRevenue = courseOrdersCurrent.reduce(
      (sum, row) => sum + this.toVndNumber(row.total),
      0,
    )
    const currentProductRevenue = productOrdersCurrent.reduce(
      (sum, row) => sum + this.toVndNumber(row.total),
      0,
    )
    const currentPackageRevenue = packagePaymentsCurrent.reduce(
      (sum, row) => sum + this.toVndNumber(row.amount),
      0,
    )

    const prevCourseRevenue = courseOrdersPrev.reduce((sum, row) => sum + this.toVndNumber(row.total), 0)
    const prevProductRevenue = productOrdersPrev.reduce((sum, row) => sum + this.toVndNumber(row.total), 0)
    const prevPackageRevenue = packagePaymentsPrev.reduce(
      (sum, row) => sum + this.toVndNumber(row.amount),
      0,
    )

    const currentRevenue = currentCourseRevenue + currentProductRevenue + currentPackageRevenue
    const prevRevenue = prevCourseRevenue + prevProductRevenue + prevPackageRevenue

    const currentOrders =
      courseOrdersCurrent.length + productOrdersCurrent.length + packagePaymentsCurrent.length
    const prevOrders = courseOrdersPrev.length + productOrdersPrev.length + packagePaymentsPrev.length

    const completionRate = lessonProgressCount
      ? Math.round((completedCount / lessonProgressCount) * 100)
      : 0

    const courseRevenueByDay = new Map<string, number>()
    const productRevenueByDay = new Map<string, number>()
    const packageRevenueByDay = new Map<string, number>()
    const courseOrdersByDay = new Map<string, number>()
    const productOrdersByDay = new Map<string, number>()
    const packageOrdersByDay = new Map<string, number>()

    courseOrdersCurrent.forEach((row) => {
      const date = row.paidAt ?? row.createdAt
      const key = this.toDayKey(date)
      this.addMapValue(courseRevenueByDay, key, this.toVndNumber(row.total))
      this.addMapValue(courseOrdersByDay, key, 1)
    })

    productOrdersCurrent.forEach((row) => {
      const date = row.paidAt ?? row.createdAt
      const key = this.toDayKey(date)
      this.addMapValue(productRevenueByDay, key, this.toVndNumber(row.total))
      this.addMapValue(productOrdersByDay, key, 1)
    })

    packagePaymentsCurrent.forEach((row) => {
      const date = row.paidAt ?? row.createdAt
      const key = this.toDayKey(date)
      this.addMapValue(packageRevenueByDay, key, this.toVndNumber(row.amount))
      this.addMapValue(packageOrdersByDay, key, 1)
    })

    const labels: string[] = []
    const totalRevenueSeries: number[] = []
    const courseRevenueSeries: number[] = []
    const productRevenueSeries: number[] = []
    const packageRevenueSeries: number[] = []
    const orderSeries: number[] = []

    for (let i = rangeDays - 1; i >= 0; i -= 1) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const key = this.toDayKey(d)
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`)

      const courseDayRevenue = courseRevenueByDay.get(key) ?? 0
      const productDayRevenue = productRevenueByDay.get(key) ?? 0
      const packageDayRevenue = packageRevenueByDay.get(key) ?? 0

      totalRevenueSeries.push(courseDayRevenue + productDayRevenue + packageDayRevenue)
      courseRevenueSeries.push(courseDayRevenue)
      productRevenueSeries.push(productDayRevenue)
      packageRevenueSeries.push(packageDayRevenue)
      orderSeries.push(
        (courseOrdersByDay.get(key) ?? 0) +
          (productOrdersByDay.get(key) ?? 0) +
          (packageOrdersByDay.get(key) ?? 0),
      )
    }

    const topCourseIds = topCourses.map((item) => item.courseId)
    const topCourseRows = topCourseIds.length
      ? await this.prisma.course.findMany({
          where: { id: { in: topCourseIds } },
          select: { id: true, title: true },
        })
      : []
    const topCourseNameMap = new Map(topCourseRows.map((item) => [item.id, item.title]))

    const topCoursesWithInfo = topCourses.map((item, index) => ({
      name: topCourseNameMap.get(item.courseId) ?? `Khoá #${item.courseId}`,
      revenue: Number(item._sum.price ?? 0),
      orders: item._count._all,
      trend: `+${Math.max(3, 12 - index * 2)}%`,
    }))

    const paymentMethodMap = new Map<ProductPaymentMethod, number>()
    productOrdersCurrent.forEach((row) => {
      const current = paymentMethodMap.get(row.paymentMethod) ?? 0
      paymentMethodMap.set(row.paymentMethod, current + this.toVndNumber(row.total))
    })

    const revenueByPayment = (['COD', 'SEPAY'] as const)
      .map((method) => ({ method, revenue: paymentMethodMap.get(method) ?? 0 }))
      .filter((item) => item.revenue > 0)

    const categoryIds = Array.from(
      new Set(
        revenueByCategory
          .map((item) => item.productId)
          .filter((id): id is bigint => typeof id === 'bigint'),
      ),
    )

    const products = categoryIds.length
      ? await this.prisma.catalogProduct.findMany({
          where: { id: { in: categoryIds } },
          select: {
            id: true,
            categoryId: true,
            category: {
              select: {
                translations: {
                  select: {
                    languageCode: true,
                    name: true,
                  },
                },
              },
            },
          },
        })
      : []

    const productToCategory = new Map<bigint, string>()
    products.forEach((product) => {
      const viTranslation = product.category?.translations.find(
        (item) => item.languageCode === 'vi' || item.languageCode === 'vi-VN',
      )
      const fallbackTranslation = product.category?.translations[0]

      productToCategory.set(
        product.id,
        viTranslation?.name ??
          fallbackTranslation?.name ??
          `Danh mục #${String(product.categoryId ?? 0)}`,
      )
    })

    const categoryRevenueMap = new Map<string, number>()
    revenueByCategory.forEach((row) => {
      const categoryName = productToCategory.get(row.productId) ?? 'Chưa phân loại'
      const current = categoryRevenueMap.get(categoryName) ?? 0
      categoryRevenueMap.set(categoryName, current + Number(row._sum.lineTotal ?? 0))
    })

    const revenueByProductCategory = Array.from(categoryRevenueMap.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)

    const packageRevenueByPlanMap = new Map<number, number>()
    packagePaymentsCurrent.forEach((row) => {
      const current = packageRevenueByPlanMap.get(row.planId) ?? 0
      packageRevenueByPlanMap.set(row.planId, current + this.toVndNumber(row.amount))
    })

    const planIds = Array.from(packageRevenueByPlanMap.keys())
    const plans = planIds.length
      ? await this.prisma.coursePlan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, name: true, code: true },
        })
      : []
    const planNameMap = new Map(plans.map((row) => [row.id, row.name || row.code]))

    const revenueByServicePackage = Array.from(packageRevenueByPlanMap.entries())
      .map(([planId, revenue]) => ({
        packageName: planNameMap.get(planId) ?? `Gói #${planId}`,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)

    return {
      rangeDays,
      kpis: {
        revenue: currentRevenue,
        revenueBreakdown: {
          courseRevenue: currentCourseRevenue,
          productRevenue: currentProductRevenue,
          packageRevenue: currentPackageRevenue,
        },
        orders: currentOrders,
        students: newStudents,
        completionRate,
        revenueChangePct:
          prevRevenue > 0
            ? Number((((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
            : 0,
        ordersChangePct:
          prevOrders > 0
            ? Number((((currentOrders - prevOrders) / prevOrders) * 100).toFixed(1))
            : 0,
      },
      lineChart: {
        labels,
        revenue: totalRevenueSeries,
        orders: orderSeries,
        courseRevenue: courseRevenueSeries,
        productRevenue: productRevenueSeries,
        packageRevenue: packageRevenueSeries,
      },
      topCourses: topCoursesWithInfo,
      recentOrders: recentOrders.map((order) => ({
        code: order.code,
        student: order.user.name || order.user.email,
        course: order.items[0]?.courseTitle ?? '-',
        total: order.total,
        status: order.status,
        date: order.createdAt.toISOString().slice(0, 10),
      })),
      studentProgress: studentsProgress.map((item) => ({
        name: item.user.name || item.user.email,
        course: item.lesson?.course?.title ?? '-',
        progress: item.percent,
      })),
      revenueByPayment,
      revenueByProductCategory,
      revenueByServicePackage,
    }
  }
}
