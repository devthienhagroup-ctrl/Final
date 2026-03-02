import { Injectable } from '@nestjs/common'
import { OrderStatus, ProductOrderStatus, ProductPaymentStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

type DashboardRange = 7 | 30 | 90

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

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

    async getStats(rawRange?: string) {
        const rangeDays = this.parseRange(rawRange)
        const startDate = this.getRangeStart(rangeDays)

        const [
            paidCourseOrders,
            paidProductOrders,
            paidCourseOrdersPrev,
            paidProductOrdersPrev,
            newStudents,
            enrolledCount,
            completedCount,
            lineRevenue,
            lineOrders,
            topCourses,
            recentOrders,
            studentsProgress,
            paymentMethodRevenue,
            revenueByCategory,
        ] = await Promise.all([
            this.prisma.order.aggregate({
                _sum: { total: true },
                _count: { _all: true },
                where: { status: OrderStatus.PAID, createdAt: { gte: startDate } },
            }),
            this.prisma.productOrder.aggregate({
                _sum: { total: true },
                _count: { _all: true },
                where: {
                    paymentStatus: ProductPaymentStatus.PAID,
                    status: { in: [ProductOrderStatus.PAID, ProductOrderStatus.SHIPPING, ProductOrderStatus.SUCCESS] },
                    createdAt: { gte: startDate },
                },
            }),
            this.prisma.order.aggregate({
                _sum: { total: true },
                _count: { _all: true },
                where: {
                    status: OrderStatus.PAID,
                    createdAt: {
                        gte: new Date(startDate.getTime() - rangeDays * 24 * 60 * 60 * 1000),
                        lt: startDate,
                    },
                },
            }),
            this.prisma.productOrder.aggregate({
                _sum: { total: true },
                _count: { _all: true },
                where: {
                    paymentStatus: ProductPaymentStatus.PAID,
                    status: { in: [ProductOrderStatus.PAID, ProductOrderStatus.SHIPPING, ProductOrderStatus.SUCCESS] },
                    createdAt: {
                        gte: new Date(startDate.getTime() - rangeDays * 24 * 60 * 60 * 1000),
                        lt: startDate,
                    },
                },
            }),
            this.prisma.user.count({ where: { createdAt: { gte: startDate } } }),
            this.prisma.enrollment.count({ where: { createdAt: { gte: startDate } } }),
            this.prisma.lessonProgress.count({ where: { done: true, updatedAt: { gte: startDate } } }),
            this.prisma.order.groupBy({
                by: ['createdAt'],
                _sum: { total: true },
                where: { status: OrderStatus.PAID, createdAt: { gte: startDate } },
            }),
            this.prisma.order.groupBy({
                by: ['createdAt'],
                _count: { _all: true },
                where: { status: OrderStatus.PAID, createdAt: { gte: startDate } },
            }),
            this.prisma.orderItem.groupBy({
                by: ['courseId'],
                _sum: { price: true },
                _count: { _all: true },
                where: { order: { status: OrderStatus.PAID, createdAt: { gte: startDate } } },
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
            this.prisma.productOrder.groupBy({
                by: ['paymentMethod'],
                _sum: { total: true },
                where: {
                    paymentStatus: ProductPaymentStatus.PAID,
                    status: { in: [ProductOrderStatus.PAID, ProductOrderStatus.SHIPPING, ProductOrderStatus.SUCCESS] },
                    createdAt: { gte: startDate },
                },
            }),
            this.prisma.productOrderDetail.groupBy({
                by: ['productId'],
                _sum: { lineTotal: true },
                where: {
                    order: {
                        paymentStatus: ProductPaymentStatus.PAID,
                        status: { in: [ProductOrderStatus.PAID, ProductOrderStatus.SHIPPING, ProductOrderStatus.SUCCESS] },
                        createdAt: { gte: startDate },
                    },
                },
            }),
        ])

        const prevRevenue =
            Number(paidCourseOrdersPrev._sum.total ?? 0) + Number(paidProductOrdersPrev._sum.total ?? 0)
        const currentRevenue = Number(paidCourseOrders._sum.total ?? 0) + Number(paidProductOrders._sum.total ?? 0)
        const currentOrders = Number(paidCourseOrders._count._all ?? 0) + Number(paidProductOrders._count._all ?? 0)
        const prevOrders = Number(paidCourseOrdersPrev._count._all ?? 0) + Number(paidProductOrdersPrev._count._all ?? 0)

        const completionRate = enrolledCount ? Math.round((completedCount / enrolledCount) * 100) : 0

        const labels: string[] = []
        const revenueSeries: number[] = []
        const orderSeries: number[] = []

        for (let i = rangeDays - 1; i >= 0; i -= 1) {
            const d = new Date()
            d.setHours(0, 0, 0, 0)
            d.setDate(d.getDate() - i)
            const key = d.toISOString().slice(0, 10)
            labels.push(`${d.getDate()}/${d.getMonth() + 1}`)

            const dayRevenue = lineRevenue
                .filter((row) => row.createdAt.toISOString().slice(0, 10) === key)
                .reduce((sum, row) => sum + Number(row._sum.total ?? 0), 0)
            const dayOrders = lineOrders
                .filter((row) => row.createdAt.toISOString().slice(0, 10) === key)
                .reduce((sum, row) => sum + Number(row._count._all ?? 0), 0)

            revenueSeries.push(dayRevenue)
            orderSeries.push(dayOrders)
        }

        const topCoursesWithInfo = await Promise.all(
            topCourses.map(async (item, index) => {
                const course = await this.prisma.course.findUnique({
                    where: { id: item.courseId },
                    select: { title: true },
                })

                return {
                    name: course?.title ?? `Khoá #${item.courseId}`,
                    revenue: Number(item._sum.price ?? 0),
                    orders: item._count._all,
                    trend: `+${Math.max(3, 12 - index * 2)}%`,
                }
            }),
        )

        const categoryIds = Array.from(
            new Set(
                revenueByCategory.map((item) => item.productId).filter((id): id is bigint => typeof id === 'bigint'),
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
                                where: { languageCode: 'vi' },
                                take: 1,
                                select: { name: true },
                            },
                        },
                    },
                },
            })
            : []

        const productToCategory = new Map<bigint, string>()
        products.forEach((product) => {
            productToCategory.set(
                product.id,
                product.category?.translations?.[0]?.name ?? `Danh mục #${String(product.categoryId ?? 0)}`,
            )
        })

        const categoryRevenueMap = new Map<string, number>()
        revenueByCategory.forEach((row) => {
            const categoryName = productToCategory.get(row.productId) ?? 'Chưa phân loại'
            const current = categoryRevenueMap.get(categoryName) ?? 0
            categoryRevenueMap.set(categoryName, current + Number(row._sum.lineTotal ?? 0))
        })

        const revenueByPayment = paymentMethodRevenue.map((row) => ({
            method: row.paymentMethod,
            revenue: Number(row._sum.total ?? 0),
        }))

        const revenueByProductCategory = Array.from(categoryRevenueMap.entries())
            .map(([category, revenue]) => ({ category, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6)

        return {
            rangeDays,
            kpis: {
                revenue: currentRevenue,
                orders: currentOrders,
                students: newStudents,
                completionRate,
                revenueChangePct: prevRevenue > 0 ? Number((((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)) : 0,
                ordersChangePct: prevOrders > 0 ? Number((((currentOrders - prevOrders) / prevOrders) * 100).toFixed(1)) : 0,
            },
            lineChart: {
                labels,
                revenue: revenueSeries,
                orders: orderSeries,
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
        }
    }
}
