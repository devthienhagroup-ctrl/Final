import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { promises as fs } from 'fs'
import { createHash, createHmac, randomBytes } from 'crypto'
import { extname, join } from 'path'
import * as tls from 'tls'
import { PrismaService } from '../prisma/prisma.service'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { AppointmentStatsQueryDto } from './dto/booking-query.dto'
import {
  BranchResponseDto,
  ServiceCatalogItemDto,
  ServiceCategoryResponseDto,
  ServiceListResponseDto,
  ServiceDetailResponseDto,
  ServiceResponseDto,
  ServiceReviewResponseDto,
  SpecialistResponseDto,
  TempImageResponseDto,
} from './dto/booking-response.dto'

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name)


  private readonly supportedLocales = ['en', 'vi', 'de'] as const

  private normalizeLocale(locale?: string) {
    if (!locale) return 'en'
    const normalized = locale.toLowerCase() === 'en-us' ? 'en' : locale
    return this.supportedLocales.includes(normalized as any) ? normalized as 'en' | 'vi' | 'de' : 'en'
  }

  private pickTranslation<T extends { locale: string }>(translations: T[] | undefined, locale: string) {
    if (!translations?.length) return undefined
    return translations.find((item) => item.locale === locale)
      ?? translations.find((item) => item.locale === 'en')
      ?? translations[0]
  }

  private toTranslationRecord<T extends { locale: string }, TData>(
    translations: T[] | undefined,
    mapper: (item: T) => TData,
  ): Partial<Record<'en' | 'vi' | 'de', TData>> {
    if (!translations?.length) return {}
    return translations.reduce<Partial<Record<'en' | 'vi' | 'de', TData>>>((acc, item) => {
      if (!this.supportedLocales.includes(item.locale as any)) return acc
      acc[item.locale as 'en' | 'vi' | 'de'] = mapper(item)
      return acc
    }, {})
  }
  constructor(private readonly prisma: PrismaService) {}

  private toPositiveIntArray(value: unknown): number[] {
    if (!Array.isArray(value)) return []
    return [...new Set(value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))]
  }

  private readonly s3Bucket = process.env.CLOUDFLY_BUCKET || 'ayanavita-dev'
  private readonly s3Region = process.env.CLOUDFLY_REGION || 'auto'
  private readonly s3Endpoint = process.env.CLOUDFLY_ENDPOINT || 'https://s3.cloudfly.vn'
  private readonly s3PublicBaseUrl = process.env.CLOUDFLY_PUBLIC_BASE_URL
  private readonly s3AccessKey = process.env.CLOUDFLY_ACCESS_KEY || '67NZA2R2X53AYJU5I036'
  private readonly s3SecretKey = process.env.CLOUDFLY_SECRET_KEY || '56f8Erg7KoBiIedMrvbe0cBNjy3OIPKHdX0vAW4N'

  private toStringArray(value: Prisma.JsonValue | null | undefined): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }

  private readonly tempImageDir = join(process.cwd(), 'temp-images')

  async saveTempImage(file: any): Promise<TempImageResponseDto> {
    await fs.mkdir(this.tempImageDir, { recursive: true })
    const safeExt = extname(file.originalname || '').slice(0, 10) || '.jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`
    const filePath = join(this.tempImageDir, fileName)
    await fs.writeFile(filePath, file.buffer)

    return {
      fileName,
      url: `/booking-temp-images/${fileName}`,
      size: file.size,
    }
  }

  private hmac(key: Buffer | string, value: string) {
    return createHmac('sha256', key).update(value, 'utf8').digest()
  }

  private publicCloudUrl(key: string) {
    const baseUrl = this.s3PublicBaseUrl?.trim().replace(/\/$/, '') || this.s3Endpoint.replace(/\/$/, '')
    return `${baseUrl}/${this.s3Bucket}/${key}`
  }

  private extractCloudKey(input: { fileName?: string; url?: string }) {
    if (input.fileName) return decodeURIComponent(input.fileName)
    if (!input.url) return null
    const withoutQuery = input.url.split('?')[0]
    const bucketPath = `/${this.s3Bucket}/`
    const bucketIndex = withoutQuery.indexOf(bucketPath)
    if (bucketIndex >= 0) return decodeURIComponent(withoutQuery.slice(bucketIndex + bucketPath.length))
    const parsed = withoutQuery.split('.s3.cloudfly.vn/')[1]
    return parsed ? decodeURIComponent(parsed) : null
  }

  private async signedS3Request(method: 'PUT' | 'DELETE', key: string, file?: any) {
    const endpointHost = new URL(this.s3Endpoint).host
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.slice(0, 8)
    const payloadHash = method === 'PUT' && file
      ? createHash('sha256').update(file.buffer).digest('hex')
      : createHash('sha256').update('').digest('hex')
    const contentType = file?.mimetype || 'image/jpeg'
    const acl = 'public-read'

    const signingHeaders: Record<string, string> = {
      host: endpointHost,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    }
    if (method === 'PUT') {
      signingHeaders['content-type'] = contentType
      signingHeaders['x-amz-acl'] = acl
    }

    const sortedHeaderKeys = Object.keys(signingHeaders).sort()
    const canonicalHeaders = sortedHeaderKeys.map((headerKey) => `${headerKey}:${signingHeaders[headerKey]}`).join('\n') + '\n'
    const signedHeaders = sortedHeaderKeys.join(';')
    const canonicalRequest = [method, `/${this.s3Bucket}/${key}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')
    const credentialScope = `${dateStamp}/${this.s3Region}/s3/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n')

    const kDate = this.hmac(`AWS4${this.s3SecretKey}`, dateStamp)
    const kRegion = this.hmac(kDate, this.s3Region)
    const kService = this.hmac(kRegion, 's3')
    const kSigning = this.hmac(kService, 'aws4_request')
    const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.s3AccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    const uploadUrl = `${this.s3Endpoint.replace(/\/$/, '')}/${this.s3Bucket}/${key}`

    const headers: Record<string, string> = {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
    }

    if (method === 'PUT' && file) {
      headers['content-type'] = contentType
      headers['x-amz-acl'] = acl
    }

    const res = await fetch(uploadUrl, {
      method,
      headers,
      body: method === 'PUT' ? file?.buffer : undefined,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new BadRequestException(`Cloud ${method} failed: ${text || res.status}`)
    }

    return uploadUrl
  }

  async uploadImageToCloud(file: any): Promise<TempImageResponseDto> {
    const safeExt = extname(file.originalname || '').slice(0, 10) || '.jpg'
    const key = `spa/${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`
    await this.signedS3Request('PUT', key, file)

    return {
      fileName: key,
      url: this.publicCloudUrl(key),
      size: file.size,
    }
  }

  async deleteCloudImage(input: { fileName?: string; url?: string }) {
    const key = this.extractCloudKey(input)
    if (!key) throw new BadRequestException('fileName or url is required')
    await this.signedS3Request('DELETE', key)
    return { ok: true }
  }

  async deleteTempImage(fileName: string) {
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
      throw new BadRequestException('Invalid file name')
    }

    const filePath = join(this.tempImageDir, fileName)
    try {
      await fs.unlink(filePath)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  }

  async listServicesCatalog(locale?: string): Promise<ServiceCatalogItemDto[]> {
    const lang = this.normalizeLocale(locale)
    const rows = await this.prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: { select: { name: true, translations: { select: { locale: true, name: true } } } },
        goals: true,
        suitableFor: true,
        durationMin: true,
        price: true,
        ratingAvg: true,
        bookedCount: true,
        imageUrl: true,
        tag: true,
        translations: { select: { locale: true, name: true, goals: true, tag: true } },
      },
      orderBy: { id: 'asc' },
    })

    return rows.map((s) => {
      const trans = this.pickTranslation(s.translations, lang)
      const categoryTrans = this.pickTranslation(s.category?.translations, lang)
      return {
        id: String(s.id),
        dbId: s.id,
        name: trans?.name || s.name,
        cat: (categoryTrans?.name || s.category?.name || 'health'),
        goal: this.toStringArray(trans?.goals ?? s.goals),
        duration: s.durationMin,
        price: s.price,
        rating: s.ratingAvg,
        booked: s.bookedCount,
        img: s.imageUrl,
        tag: trans?.tag || s.tag || 'Spa',
      }
    })
  }

  async listBranches(includeInactive = false, serviceId?: number, locale?: string): Promise<BranchResponseDto[]> {
    const rows = await this.prisma.branch.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(serviceId ? { services: { some: { serviceId } } } : {}),
      },
      select: { id: true, code: true, name: true, address: true, phone: true, isActive: true, translations: { select: { locale: true, name: true, address: true } } },
      orderBy: { id: 'asc' },
    })

    const lang = this.normalizeLocale(locale)
    return rows.map((b) => {
      const trans = this.pickTranslation(b.translations, lang)
      return {
        id: b.id,
        code: b.code,
        name: trans?.name || b.name,
        address: trans?.address || b.address,
        phone: b.phone,
        isActive: b.isActive,
        translations: this.toTranslationRecord(b.translations, (item) => ({ name: item.name, address: item.address })),
      }
    })
  }

  async listServices(params: { branchId?: number; q?: string; page?: number; pageSize?: number; includeInactive?: boolean; lang?: string }): Promise<ServiceListResponseDto> {
    const page = params.page && params.page > 0 ? params.page : 1
    const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 10
    const skip = (page - 1) * pageSize
    const query = params.q?.trim()
    const locale = this.normalizeLocale(params.lang)

    const where: Prisma.ServiceWhereInput = {
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(params.branchId ? { branches: { some: { branchId: params.branchId } } } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { translations: { some: { locale, name: { contains: query } } } },
            ],
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        select: {
          id: true,
            name: true,
          description: true,
          categoryId: true,
          category: { select: { name: true } },
          goals: true,
          suitableFor: true,
          process: true,
          durationMin: true,
          price: true,
          ratingAvg: true,
          bookedCount: true,
          tag: true,
          imageUrl: true,
            isActive: true,
          branches: { select: { branchId: true } },
          translations: { select: { locale: true, name: true, description: true, goals: true, suitableFor: true, process: true, tag: true } },
        },
        orderBy: { id: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.service.count({ where }),
    ])

    const items: ServiceResponseDto[] = rows.map((s) => {
      const trans = this.pickTranslation(s.translations, locale)
      return {
        id: s.id,
        name: trans?.name || s.name,
      description: trans?.description || s.description,
      categoryId: s.categoryId,
      category: s.category?.name,
      goals: this.toStringArray(trans?.goals ?? s.goals),
      suitableFor: this.toStringArray(trans?.suitableFor ?? s.suitableFor),
      process: this.toStringArray(trans?.process ?? s.process),
      durationMin: s.durationMin,
      price: s.price,
      ratingAvg: s.ratingAvg,
      bookedCount: s.bookedCount,
      tag: trans?.tag || s.tag,
      imageUrl: s.imageUrl,
      branchIds: s.branches.map((b) => b.branchId),
        isActive: s.isActive,
        translations: this.toTranslationRecord(s.translations, (item) => ({
          name: item.name,
          description: item.description,
          goals: this.toStringArray(item.goals),
          suitableFor: this.toStringArray(item.suitableFor),
          process: this.toStringArray(item.process),
          tag: item.tag,
        })),
      }
    })

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    }
  }


  async getServiceDetail(id: number, locale?: string): Promise<ServiceDetailResponseDto> {
    const row = await this.prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
          name: true,
        description: true,
        categoryId: true,
        category: { select: { name: true } },
        goals: true,
        suitableFor: true,
        process: true,
        durationMin: true,
        price: true,
        ratingAvg: true,
        bookedCount: true,
        tag: true,
        imageUrl: true,
          isActive: true,
        branches: { select: { branchId: true } },
        translations: { select: { locale: true, name: true, description: true, goals: true, suitableFor: true, process: true, tag: true } },
        reviews: {
          select: {
            id: true,
            serviceId: true,
            userId: true,
            stars: true,
            comment: true,
            customerName: true,
            createdAt: true,
          },
          orderBy: { id: 'desc' },
        },
      },
    })

    if (!row) throw new NotFoundException('Service not found')

    const lang = this.normalizeLocale(locale)
    const trans = this.pickTranslation(row.translations, lang)
    return {
      id: row.id,
        name: trans?.name || row.name,
      description: trans?.description || row.description,
      categoryId: row.categoryId,
      category: row.category?.name,
      goals: this.toStringArray(trans?.goals ?? row.goals),
      suitableFor: this.toStringArray(trans?.suitableFor ?? row.suitableFor),
      process: this.toStringArray(trans?.process ?? row.process),
      durationMin: row.durationMin,
      price: row.price,
      ratingAvg: row.ratingAvg,
      bookedCount: row.bookedCount,
      tag: trans?.tag || row.tag,
      imageUrl: row.imageUrl,
      branchIds: row.branches.map((b) => b.branchId),
        isActive: row.isActive,
      translations: this.toTranslationRecord(row.translations, (item) => ({
        name: item.name,
        description: item.description,
        goals: this.toStringArray(item.goals),
        suitableFor: this.toStringArray(item.suitableFor),
        process: this.toStringArray(item.process),
        tag: item.tag,
      })),
      reviews: row.reviews,
    }
  }

  async listSpecialists(branchId?: number, serviceId?: number, locale?: string): Promise<SpecialistResponseDto[]> {
    const rows = await this.prisma.specialist.findMany({
      where: {
          isActive: true,
        ...(branchId ? { branchId } : {}),
        ...(serviceId ? { serviceLinks: { some: { serviceId } } } : {}),
      },
      select: {
        id: true,
          name: true,
        level: true,
        bio: true,
        branchId: true,
        user: { select: { email: true } },
        serviceLinks: { select: { serviceId: true } },
        translations: { select: { locale: true, name: true, bio: true } },
      },
      orderBy: { id: 'asc' },
    })

    const lang = this.normalizeLocale(locale)
    return rows.map((s) => {
      const trans = this.pickTranslation(s.translations, lang)
      return {
        id: s.id,
        name: trans?.name || s.name,
      email: s.user.email,
      level: s.level,
      bio: trans?.bio || s.bio,
      branchId: s.branchId,
      serviceIds: [...new Set(s.serviceLinks.map((srv) => srv.serviceId))],
      translations: this.toTranslationRecord(s.translations, (item) => ({ name: item.name, bio: item.bio })),
      }
    })
  }




  async getAppointmentStats(query: AppointmentStatsQueryDto, user: JwtUser) {
    const whereScope = await this.resolveAppointmentScope(user)
    const where: Prisma.AppointmentWhereInput = {
      ...whereScope,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.serviceId ? { serviceId: query.serviceId } : {}),
      ...(query.specialistId ? { specialistId: query.specialistId } : {}),
      ...(query.customerPhone?.trim() ? { customerPhone: { contains: query.customerPhone.trim() } } : {}),
    }

    const [total, statsRows] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        select: {
          status: true,
          serviceId: true,
          specialistId: true,
          appointmentAt: true,
        },
      }),
    ])

    const statusBucket = new Map<string, number>()
    const serviceBucket = new Map<number | null, number>()
    const specialistBucket = new Map<number | null, number>()
    const monthBucket = new Map<string, number>()

    statsRows.forEach((row) => {
      const statusKey = row.status || 'PENDING'
      statusBucket.set(statusKey, (statusBucket.get(statusKey) || 0) + 1)
      serviceBucket.set(row.serviceId ?? null, (serviceBucket.get(row.serviceId ?? null) || 0) + 1)
      specialistBucket.set(row.specialistId ?? null, (specialistBucket.get(row.specialistId ?? null) || 0) + 1)

      const date = row.appointmentAt
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthBucket.set(monthKey, (monthBucket.get(monthKey) || 0) + 1)
    })

    const byServiceRows = [...serviceBucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([serviceId, count]) => ({ serviceId, count }))

    const bySpecialistRows = [...specialistBucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([specialistId, count]) => ({ specialistId, count }))

    const serviceIds = byServiceRows
      .map((row) => row.serviceId)
      .filter((id): id is number => typeof id === 'number')

    const specialistIds = bySpecialistRows
      .map((row) => row.specialistId)
      .filter((id): id is number => typeof id === 'number')

    const [serviceMapRows, specialistMapRows] = await Promise.all([
      serviceIds.length
        ? this.prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
      specialistIds.length
        ? this.prisma.specialist.findMany({ where: { id: { in: specialistIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
    ])

    const serviceNameMap = new Map(serviceMapRows.map((row) => [row.id, row.name]))
    const specialistNameMap = new Map(specialistMapRows.map((row) => [row.id, row.name]))

    return {
      total,
      byStatus: [...statusBucket.entries()].reduce<Record<string, number>>((acc, [status, value]) => {
        acc[status] = value
        return acc
      }, {}),
      byService: byServiceRows.map((row) => ({
        label: row.serviceId ? (serviceNameMap.get(row.serviceId) || `Dịch vụ #${row.serviceId}`) : 'Khác',
        value: row.count,
      })),
      bySpecialist: bySpecialistRows.map((row) => ({
        label: row.specialistId ? (specialistNameMap.get(row.specialistId) || `Chuyên viên #${row.specialistId}`) : 'Chưa phân công',
        value: row.count,
      })),
      byMonth: [...monthBucket.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value })),
    }
  }

  async listAppointments(user: JwtUser) {
    const where = await this.resolveAppointmentScope(user)
    return this.prisma.appointment.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMin: true, price: true } },
        specialist: { select: { id: true, name: true, level: true } },
      },
      orderBy: { appointmentAt: 'desc' },
    })
  }

  private parseDateWindow(date: string) {
    const dayStart = new Date(`${date}T00:00:00`)
    const dayEnd = new Date(`${date}T23:59:59.999`)
    if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
      throw new BadRequestException('Invalid date format, expected yyyy-mm-dd')
    }
    return { dayStart, dayEnd }
  }

  private toTimeLabel(date: Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  private overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
    return startA < endB && endA > startB
  }

  private async resolveAppointmentScope(user: JwtUser): Promise<Prisma.AppointmentWhereInput> {
    if (user.role === Role.ADMIN) return {}

    if (user.role === Role.STAFF) {
      const specialist = await this.prisma.specialist.findFirst({
        where: { userId: user.sub, isActive: true },
        select: { id: true },
      })
      if (!specialist) {
        throw new ForbiddenException('Specialist profile is not active')
      }
      return { specialistId: specialist.id }
    }

    throw new ForbiddenException('Bạn không có quyền xem lịch hẹn')
  }

  private async validateSpecialistForAppointment(params: {
    specialistId: number
    branchId: number
    serviceId: number
    appointmentAt: Date
    serviceDurationMin: number
    ignoreAppointmentId?: number
  }) {
    const specialist = await this.prisma.specialist.findUnique({
      where: { id: params.specialistId },
      select: { id: true, name: true, branchId: true, isActive: true, user: { select: { email: true } } },
    })

    if (!specialist || !specialist.isActive) {
      throw new NotFoundException('Specialist not found')
    }

    if (specialist.branchId !== params.branchId) {
      throw new BadRequestException('Specialist does not belong to this branch')
    }

    const specialistBranchService = await this.prisma.specialistBranchService.findUnique({
      where: {
        specialistId_branchId_serviceId: {
          specialistId: params.specialistId,
          branchId: params.branchId,
          serviceId: params.serviceId,
        },
      },
    })
    if (!specialistBranchService) {
      throw new BadRequestException('Specialist is not available for this service in selected branch')
    }

    const specialistAppointments = await this.prisma.appointment.findMany({
      where: {
        specialistId: params.specialistId,
        status: { not: 'CANCELED' },
        appointmentAt: {
          gte: new Date(params.appointmentAt.getTime() - 12 * 60 * 60 * 1000),
          lte: new Date(params.appointmentAt.getTime() + 12 * 60 * 60 * 1000),
        },
        ...(params.ignoreAppointmentId ? { id: { not: params.ignoreAppointmentId } } : {}),
      },
      select: { appointmentAt: true, service: { select: { durationMin: true } } },
    })

    const specialistConflict = specialistAppointments.some((row) => {
      const start = new Date(row.appointmentAt)
      const end = new Date(start.getTime() + row.service.durationMin * 60000)
      return this.overlaps(params.appointmentAt, new Date(params.appointmentAt.getTime() + params.serviceDurationMin * 60000), start, end)
    })

    if (specialistConflict) {
      throw new BadRequestException('Specialist is already occupied at this time')
    }

    return specialist
  }

  private async getServiceCapacity(branchId: number, serviceId: number) {
    return this.prisma.specialistBranchService.count({
      where: {
        branchId,
        serviceId,
        specialist: { isActive: true },
      },
    })
  }

  private async countOverlappingAppointments(params: {
    branchId: number
    serviceId: number
    start: Date
    end: Date
    ignoreAppointmentId?: number
  }) {
    const rows = await this.prisma.appointment.findMany({
      where: {
        branchId: params.branchId,
        serviceId: params.serviceId,
        status: { not: 'CANCELED' },
        appointmentAt: {
          gte: new Date(params.start.getTime() - 12 * 60 * 60 * 1000),
          lte: new Date(params.end.getTime() + 12 * 60 * 60 * 1000),
        },
        ...(params.ignoreAppointmentId ? { id: { not: params.ignoreAppointmentId } } : {}),
      },
      select: { id: true, appointmentAt: true, service: { select: { durationMin: true } } },
    })

    return rows.filter((row) => {
      const start = new Date(row.appointmentAt)
      const end = new Date(start.getTime() + row.service.durationMin * 60000)
      return this.overlaps(params.start, params.end, start, end)
    }).length
  }

  async getSlotSuggestions(branchId: number, serviceId: number, date: string) {
    const [service, branchService] = await Promise.all([
      this.prisma.service.findUnique({ where: { id: serviceId }, select: { id: true, durationMin: true } }),
      this.prisma.branchService.findUnique({ where: { branchId_serviceId: { branchId, serviceId } } }),
    ])

    if (!service) throw new NotFoundException('Service not found')
    if (!branchService) throw new BadRequestException('Service is not available in this branch')

    const capacity = await this.getServiceCapacity(branchId, serviceId)
    const durationMin = Math.max(1, service.durationMin || 1)

    const { dayStart } = this.parseDateWindow(date)
    const slotStart = new Date(dayStart)
    slotStart.setHours(7, 0, 0, 0)
    const closing = new Date(dayStart)
    closing.setHours(21, 0, 0, 0)

    const slots: Array<{ time: string; available: boolean; occupied: number }> = []
    for (let cursor = new Date(slotStart); cursor < closing; cursor = new Date(cursor.getTime() + durationMin * 60000)) {
      const end = new Date(cursor.getTime() + durationMin * 60000)
      const occupied = await this.countOverlappingAppointments({ branchId, serviceId, start: cursor, end })
      slots.push({
        time: this.toTimeLabel(cursor),
        occupied,
        available: capacity > occupied,
      })
    }

    return {
      durationMin,
      capacity,
      slots,
    }
  }

  async listServiceReviews(serviceId?: number): Promise<ServiceReviewResponseDto[]> {
    const rows = await this.prisma.serviceReview.findMany({
      where: serviceId ? { serviceId } : {},
      select: {
        id: true,
        serviceId: true,
        userId: true,
        stars: true,
        comment: true,
        customerName: true,
        createdAt: true,
      },
      orderBy: { id: 'desc' },
    })

    return rows
  }

  async createAppointment(dto: CreateAppointmentDto) {
    const appointmentAt = new Date(dto.appointmentAt)
    if (Number.isNaN(appointmentAt.getTime())) {
      throw new BadRequestException('Invalid appointmentAt date')
    }

    const [branch, service] = await Promise.all([
      this.prisma.branch.findUnique({ where: { id: dto.branchId } }),
      this.prisma.service.findUnique({ where: { id: dto.serviceId } }),
    ])

    if (!branch) throw new NotFoundException('Branch not found')
    if (!service) throw new NotFoundException('Service not found')

    const branchService = await this.prisma.branchService.findUnique({
      where: { branchId_serviceId: { branchId: dto.branchId, serviceId: dto.serviceId } },
    })

    if (!branchService) {
      throw new BadRequestException('Service is not available in this branch')
    }

    if (dto.specialistId) {
      await this.validateSpecialistForAppointment({
        specialistId: dto.specialistId,
        branchId: dto.branchId,
        serviceId: dto.serviceId,
        appointmentAt,
        serviceDurationMin: service.durationMin,
      })
    }

    const capacity = await this.getServiceCapacity(dto.branchId, dto.serviceId)
    const occupied = await this.countOverlappingAppointments({
      branchId: dto.branchId,
      serviceId: dto.serviceId,
      start: appointmentAt,
      end: new Date(appointmentAt.getTime() + service.durationMin * 60000),
    })

    if (capacity <= occupied) {
      throw new BadRequestException('Selected time is fully booked for this service in selected branch')
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          code: `APM-${Date.now()}`,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail,
          appointmentAt,
          note: dto.note,
          branchId: dto.branchId,
          serviceId: dto.serviceId,
          specialistId: dto.specialistId,
        },
        include: {
          branch: { select: { id: true, name: true } },
          service: { select: { id: true, name: true, durationMin: true, price: true } },
          specialist: { select: { id: true, name: true, level: true } },
        },
      })

      // 🔥 Tăng bookedCount lên 1
      await tx.service.update({
        where: { id: dto.serviceId },
        data: {
          bookedCount: {
            increment: 1,
          },
        },
      })

      return appointment
    })

    return created
  }

  async updateAppointment(id: number, data: any, user: JwtUser) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        branch: { select: { name: true } },
        service: { select: { name: true, durationMin: true } },
        specialist: { select: { id: true, name: true } },
      },
    })
    if (!appointment) throw new NotFoundException('Appointment not found')

    const payload: Prisma.AppointmentUpdateInput = {}

    if (user.role === Role.STAFF) {
      const specialist = await this.prisma.specialist.findFirst({ where: { userId: user.sub, isActive: true }, select: { id: true } })
      if (!specialist || appointment.specialistId !== specialist.id) {
        throw new ForbiddenException('Bạn chỉ có thể cập nhật lịch hẹn được phân công')
      }
      const nextStatus = String(data.status || '').toUpperCase()
      if (!['DONE', 'CANCELED'].includes(nextStatus)) {
        throw new BadRequestException('Staff only can set status DONE or CANCELED')
      }
      payload.status = nextStatus as any
      return this.prisma.appointment.update({ where: { id }, data: payload })
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền cập nhật lịch hẹn')
    }

    if (data.status !== undefined) {
      const nextStatus = String(data.status || '').toUpperCase()
      if (!['PENDING', 'CONFIRMED', 'DONE', 'CANCELED'].includes(nextStatus)) {
        throw new BadRequestException('Invalid appointment status')
      }
      payload.status = nextStatus as any
    }

    if (data.specialistId !== undefined) {
      const specialistId = data.specialistId === null || data.specialistId === '' ? null : Number(data.specialistId)
      if (specialistId !== null && (!Number.isInteger(specialistId) || specialistId < 1)) {
        throw new BadRequestException('specialistId must be a positive integer or null')
      }

      if (specialistId) {
        const specialist = await this.validateSpecialistForAppointment({
          specialistId,
          branchId: appointment.branchId,
          serviceId: appointment.serviceId,
          appointmentAt: appointment.appointmentAt,
          serviceDurationMin: appointment.service.durationMin,
          ignoreAppointmentId: appointment.id,
        })
        payload.specialist = { connect: { id: specialist.id } }

        const isChanged = appointment.specialistId !== specialist.id
        if (isChanged) {
          void this.sendAppointmentAssignmentMail({
            to: specialist.user.email,
            specialistName: specialist.name,
            appointmentCode: appointment.code,
            customerName: appointment.customerName,
            serviceName: appointment.service.name,
            branchName: appointment.branch.name,
            appointmentAt: appointment.appointmentAt,
          }).catch((error) => {
            this.logger.error(`Không gửi được email phân công lịch hẹn tới ${specialist.user.email}`, error?.stack ?? String(error))
          })
        }
      } else {
        payload.specialist = { disconnect: true }
      }
    }

    return this.prisma.appointment.update({ where: { id }, data: payload })
  }

  async deleteAppointment(id: number) {
    await this.prisma.appointment.delete({ where: { id } })
    return { ok: true }
  }


  private sanitizeServiceData(data: any): { serviceData: Prisma.ServiceUncheckedCreateInput; branchIds: number[] } {
    const goalsInput = Array.isArray(data.goals) ? data.goals : []
    const suitableForInput = Array.isArray(data.suitableFor) ? data.suitableFor : []
    const processInput = Array.isArray(data.process) ? data.process : []
    const branchIds = this.toPositiveIntArray(data.branchIds)
    const serviceData: Prisma.ServiceUncheckedCreateInput = {
        name: String(data.name ?? '').trim(),
      description: data.description,
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      goals: goalsInput,
      suitableFor: suitableForInput,
      process: processInput,
      durationMin: Number(data.durationMin ?? 60),
      price: Number(data.price ?? 0),
      tag: data.tag,
        isActive: data.isActive !== undefined ? data.isActive === true || data.isActive === 'true' : true,
    }

    return {
      serviceData,
      branchIds,
    }
  }

  async createService(data: any, file?: any) {
    if (!data.categoryId) {
      throw new BadRequestException('categoryId is required')
    }

    const { serviceData, branchIds } = this.sanitizeServiceData(data)
    if (!branchIds.length) {
      throw new BadRequestException('branchIds is required')
    }

    const availableBranches = await this.prisma.branch.count({ where: { id: { in: branchIds }, isActive: true } })
    if (availableBranches !== branchIds.length) {
      throw new BadRequestException('Some branchIds are invalid or inactive')
    }

    let imageUrl: string | undefined
    if (file) {
      const uploaded = await this.uploadImageToCloud(file)
      imageUrl = uploaded.url
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.service.create({ data: { ...serviceData, imageUrl } })
      await this.upsertServiceTranslations(tx, created.id, data.translations)
      await tx.branchService.createMany({
        data: branchIds.map((branchId) => ({ branchId, serviceId: created.id })),
        skipDuplicates: true,
      })
      return created
    })
  }

  async updateService(id: number, data: any, file?: any) {
    const existing = await this.prisma.service.findUnique({ where: { id }, select: { imageUrl: true } })
    if (!existing) throw new NotFoundException('Service not found')

    const { serviceData, branchIds } = this.sanitizeServiceData(data)
    if (!branchIds.length) {
      throw new BadRequestException('branchIds is required')
    }

    const availableBranches = await this.prisma.branch.count({ where: { id: { in: branchIds }, isActive: true } })
    if (availableBranches !== branchIds.length) {
      throw new BadRequestException('Some branchIds are invalid or inactive')
    }

    let imageUrl = existing.imageUrl
    if (file) {
      const uploaded = await this.uploadImageToCloud(file)
      imageUrl = uploaded.url
      if (existing.imageUrl) {
        try {
          await this.deleteCloudImage({ url: existing.imageUrl })
        } catch {}
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.service.update({ where: { id }, data: { ...serviceData, imageUrl } })
      await this.upsertServiceTranslations(tx, id, data.translations)
      await tx.specialistBranchService.deleteMany({
        where: {
          serviceId: id,
          branchId: { notIn: branchIds },
        },
      })
      await tx.branchService.deleteMany({ where: { serviceId: id, branchId: { notIn: branchIds } } })
      await tx.branchService.createMany({
        data: branchIds.map((branchId) => ({ branchId, serviceId: id })),
        skipDuplicates: true,
      })
      return updated
    })
  }

  async deleteService(id: number) {
    const appointmentCount = await this.prisma.appointment.count({ where: { serviceId: id } })

    if (appointmentCount > 0) {
      await this.prisma.service.update({ where: { id }, data: { isActive: false } })
      return {
        ok: true,
        softDeleted: true,
        message: 'Dịch vụ đã có lịch hẹn. Hệ thống chỉ tắt hoạt động để đảm bảo dữ liệu lịch hẹn.',
      }
    }

    await this.prisma.service.delete({ where: { id } })
    return { ok: true, softDeleted: false }
  }

  async listServiceCategories(locale?: string): Promise<ServiceCategoryResponseDto[]> {
    const rows = await this.prisma.serviceCategory.findMany({
      select: {
        id: true,
          name: true,
        _count: { select: { services: true } },
        translations: { select: { locale: true, name: true } },
      },
      orderBy: { id: 'asc' },
    })

    const lang = this.normalizeLocale(locale)
    return rows.map((item) => {
      const trans = this.pickTranslation(item.translations, lang)
      return {
        id: item.id,
        name: trans?.name || item.name,
        serviceCount: item._count.services,
        translations: this.toTranslationRecord(item.translations, (entry) => ({ name: entry.name })),
      }
    })
  }

  async createServiceCategory(data: any) {
    const created = await this.prisma.serviceCategory.create({
      data: {
        name: String(data.name || '').trim(),
      },
    })
    await this.upsertCategoryTranslations(this.prisma, created.id, data.translations)
    return created
  }

  async updateServiceCategory(id: number, data: any) {
    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
      },
    })
    await this.upsertCategoryTranslations(this.prisma, id, data.translations)
    return updated
  }

  async deleteServiceCategory(id: number) {
    const linkedServices = await this.prisma.service.count({ where: { categoryId: id } })
    if (linkedServices > 0) {
      throw new BadRequestException('Danh mục đang có dịch vụ, không thể xóa')
    }

    await this.prisma.serviceCategory.delete({ where: { id } })
    return { ok: true }
  }

  async createBranch(data: any) {
    const payload = { ...data }
    delete payload.translations
    const created = await this.prisma.branch.create({ data: payload })
    await this.upsertBranchTranslations(this.prisma, created.id, data.translations)
    return created
  }

  async updateBranch(id: number, data: any) {
    const payload = { ...data }
    delete payload.translations
    const updated = await this.prisma.branch.update({ where: { id }, data: payload })
    await this.upsertBranchTranslations(this.prisma, id, data.translations)
    return updated
  }

  async deleteBranch(id: number) {
    const [branchServiceCount, specialistCount, specialistServiceCount, appointmentCount] = await Promise.all([
      this.prisma.branchService.count({ where: { branchId: id } }),
      this.prisma.specialist.count({ where: { branchId: id } }),
      this.prisma.specialistBranchService.count({ where: { branchId: id } }),
      this.prisma.appointment.count({ where: { branchId: id } }),
    ])

    const linkedCount = branchServiceCount + specialistCount + specialistServiceCount + appointmentCount
    if (linkedCount > 0) {
      await this.prisma.branch.update({ where: { id }, data: { isActive: false } })
      return {
        ok: true,
        softDeleted: true,
        message: 'Chi nhánh đang có liên kết dữ liệu. Hệ thống đã tự động chuyển trạng thái sang không hoạt động.',
      }
    }

    await this.prisma.branch.delete({ where: { id } })
    return { ok: true, softDeleted: false }
  }

  async createSpecialist(data: any) {
    const branchId = Number(data.branchId)
    if (!Number.isInteger(branchId) || branchId < 1) {
      throw new BadRequestException('branchId is required')
    }
    const email = String(data.email || '').trim().toLowerCase()
    if (!email) {
      throw new BadRequestException('email is required')
    }
    const password = this.generatePassword()
    const passwordHash = await bcrypt.hash(password, 10)
    const serviceIds = this.toPositiveIntArray(data.serviceIds)

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: Role.STAFF,
            name: String(data.name || '').trim() || null,
        },
      })

      const specialist = await tx.specialist.create({
        data: {
            name: String(data.name || '').trim(),
          level: data.level,
          bio: data.bio,
          branchId,
          userId: user.id,
        },
      })

      await this.upsertSpecialistTranslations(tx, specialist.id, data.translations)

      if (serviceIds.length > 0) {
        await tx.specialistBranchService.createMany({
          data: serviceIds.map((serviceId) => ({ specialistId: specialist.id, branchId, serviceId })),
          skipDuplicates: true,
        })
      }

      return specialist
    })

    void this.sendSpecialistCredentialsMail(email, password, String(data.name || '').trim() || 'Chuyên viên').catch((error) => {
      this.logger.error(`Không gửi được email tài khoản chuyên viên tới ${email}`, error?.stack ?? String(error))
    })

    return created
  }

  async updateSpecialist(id: number, data: any) {
    const specialist = await this.prisma.specialist.findUnique({ where: { id }, include: { user: true } })
    if (!specialist) {
      throw new NotFoundException('Specialist not found')
    }

    const payload: Record<string, unknown> = {}
    let branchId = specialist.branchId
    if (data.branchId !== undefined) {
      const parsedBranchId = Number(data.branchId)
      if (!Number.isInteger(parsedBranchId) || parsedBranchId < 1) {
        throw new BadRequestException('branchId is invalid')
      }
      branchId = parsedBranchId
      payload.branchId = branchId
    }

    if (data.name !== undefined) payload.name = String(data.name || '').trim()
    if (data.level !== undefined) payload.level = data.level
    if (data.bio !== undefined) payload.bio = data.bio

    const email = data.email !== undefined ? String(data.email || '').trim().toLowerCase() : specialist.user.email
    const serviceIds = this.toPositiveIntArray(data.serviceIds)
    const shouldResetPassword = data.email !== undefined && email !== specialist.user.email

    if (!email) throw new BadRequestException('email is required')

    return this.prisma.$transaction(async (tx) => {
      const userData: Record<string, unknown> = {
        email,
        role: Role.STAFF,
      }
      if (data.name !== undefined) {
        userData.name = String(data.name || '').trim() || null
      }

      let plainPassword: string | null = null
      if (shouldResetPassword) {
        plainPassword = this.generatePassword()
        userData.password = await bcrypt.hash(plainPassword, 10)
      }

      await tx.user.update({ where: { id: specialist.userId }, data: userData })

      const updated = await tx.specialist.update({ where: { id }, data: payload })
      await this.upsertSpecialistTranslations(tx, id, data.translations)

      await tx.specialistBranchService.deleteMany({ where: { specialistId: id } })
      await this.upsertSpecialistTranslations(tx, specialist.id, data.translations)

      if (serviceIds.length > 0) {
        await tx.specialistBranchService.createMany({
          data: serviceIds.map((serviceId) => ({ specialistId: id, branchId, serviceId })),
          skipDuplicates: true,
        })
      }

      if (plainPassword) {
        void this.sendSpecialistCredentialsMail(email, plainPassword, String(data.name || specialist.name || '').trim() || 'Chuyên viên').catch((error) => {
          this.logger.error(`Không gửi được email mật khẩu mới tới ${email}`, error?.stack ?? String(error))
        })
      }

      return updated
    })
  }


  private normalizeTranslations(input: any, fields: string[]): Array<{ locale: 'en' | 'vi' | 'de'; data: Record<string, any> }> {
    if (!input || typeof input !== 'object') return []
    return this.supportedLocales.reduce<Array<{ locale: 'en' | 'vi' | 'de'; data: Record<string, any> }>>((acc, locale) => {
      const value = input[locale]
      if (!value || typeof value !== 'object') return acc
      const data: Record<string, any> = {}
      fields.forEach((field) => {
        if (value[field] !== undefined) data[field] = value[field]
      })
      acc.push({ locale, data })
      return acc
    }, [])
  }

  private async upsertBranchTranslations(tx: Prisma.TransactionClient | PrismaService, branchId: number, translations: any) {
    const rows = this.normalizeTranslations(translations, ['name', 'address'])
    for (const row of rows) {
      if (!row.data.name || !row.data.address) continue
      await tx.branchTranslation.upsert({
        where: { branchId_locale: { branchId, locale: row.locale } },
        create: { branchId, locale: row.locale, name: String(row.data.name), address: String(row.data.address) },
        update: { name: String(row.data.name), address: String(row.data.address) },
      })
    }
  }

  private async upsertCategoryTranslations(tx: Prisma.TransactionClient | PrismaService, categoryId: number, translations: any) {
    const rows = this.normalizeTranslations(translations, ['name'])
    for (const row of rows) {
      if (!row.data.name) continue
      await tx.serviceCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId, locale: row.locale } },
        create: { categoryId, locale: row.locale, name: String(row.data.name) },
        update: { name: String(row.data.name) },
      })
    }
  }

  private async upsertServiceTranslations(tx: Prisma.TransactionClient | PrismaService, serviceId: number, translations: any) {
    const rows = this.normalizeTranslations(translations, ['name', 'description', 'goals', 'suitableFor', 'process', 'tag'])
    for (const row of rows) {
      const name = typeof row.data.name === 'string' ? row.data.name.trim() : ''
      if (!name) continue
      await tx.serviceTranslation.upsert({
        where: { serviceId_locale: { serviceId, locale: row.locale } },
        create: {
          serviceId,
          locale: row.locale,
          name,
          ...(row.data.description !== undefined ? { description: row.data.description } : {}),
          ...(row.data.goals !== undefined ? { goals: row.data.goals } : {}),
          ...(row.data.suitableFor !== undefined ? { suitableFor: row.data.suitableFor } : {}),
          ...(row.data.process !== undefined ? { process: row.data.process } : {}),
          ...(row.data.tag !== undefined ? { tag: row.data.tag } : {}),
        },
        update: {
          name,
          ...(row.data.description !== undefined ? { description: row.data.description } : {}),
          ...(row.data.goals !== undefined ? { goals: row.data.goals } : {}),
          ...(row.data.suitableFor !== undefined ? { suitableFor: row.data.suitableFor } : {}),
          ...(row.data.process !== undefined ? { process: row.data.process } : {}),
          ...(row.data.tag !== undefined ? { tag: row.data.tag } : {}),
        },
      })
    }
  }

  private async upsertSpecialistTranslations(tx: Prisma.TransactionClient | PrismaService, specialistId: number, translations: any) {
    const rows = this.normalizeTranslations(translations, ['name', 'bio'])
    for (const row of rows) {
      if (!row.data.name) continue
      await tx.specialistTranslation.upsert({
        where: { specialistId_locale: { specialistId, locale: row.locale } },
        create: { specialistId, locale: row.locale, name: String(row.data.name), bio: row.data.bio ? String(row.data.bio) : null },
        update: { name: String(row.data.name), bio: row.data.bio ? String(row.data.bio) : null },
      })
    }
  }

  async deleteSpecialist(id: number) {
    const specialist = await this.prisma.specialist.findUnique({ where: { id }, select: { userId: true } })
    if (!specialist) throw new NotFoundException('Specialist not found')

    await this.prisma.$transaction(async (tx) => {
      await tx.specialist.delete({ where: { id } })
      await tx.user.delete({ where: { id: specialist.userId } })
    })
    return { ok: true }
  }

  private generatePassword() {
    return randomBytes(9).toString('base64url')
  }

  private async sendSpecialistCredentialsMail(email: string, password: string, name: string) {
    const user = process.env.MAIL_USER ?? 'manage.ayanavita@gmail.com'
    const pass = process.env.MAIL_PASS ?? 'xetp fhph luse qydj'
    const subject = 'Tài khoản chuyên viên AYANAVITA'
    const body = `Xin chào ${name},\n\nBạn đã được cấp tài khoản chuyên viên (STAFF) tại hệ thống AYANAVITA.\nEmail: ${email}\nMật khẩu mới: ${password}\n\nVui lòng đăng nhập và đổi mật khẩu để bảo mật tài khoản.\n\nTrân trọng,\nĐội ngũ AYANAVITA`

    await this.sendSmtpViaGmail({ user, pass, to: email, subject, body })
  }

  private async sendAppointmentAssignmentMail(params: {
    to: string
    specialistName: string
    appointmentCode: string
    customerName: string
    serviceName: string
    branchName: string
    appointmentAt: Date
  }) {
    const user = process.env.MAIL_USER ?? 'manage.ayanavita@gmail.com'
    const pass = process.env.MAIL_PASS ?? 'xetp fhph luse qydj'
    const subject = `Phân công lịch hẹn ${params.appointmentCode} - AYANAVITA`
    const body = `Xin chào ${params.specialistName},\n\nBạn vừa được phân công lịch hẹn mới.\nMã lịch hẹn: ${params.appointmentCode}\nKhách hàng: ${params.customerName}\nDịch vụ: ${params.serviceName}\nChi nhánh: ${params.branchName}\nThời gian: ${params.appointmentAt.toLocaleString('vi-VN')}\n\nVui lòng đăng nhập hệ thống để xác nhận khách có đến hay không sau khi phục vụ.\n\nTrân trọng,\nĐội ngũ AYANAVITA`

    await this.sendSmtpViaGmail({ user, pass, to: params.to, subject, body })
  }

  private async sendSmtpViaGmail(params: { user: string; pass: string; to: string; subject: string; body: string }) {
    const { user, pass, to, subject, body } = params

    const readSmtpResponse = (socket: tls.TLSSocket) =>
      new Promise<string>((resolve, reject) => {
        let buffer = ''

        const cleanup = () => {
          socket.off('data', onData)
          socket.off('error', onError)
          socket.off('close', onClose)
        }

        const onError = (err: Error) => {
          cleanup()
          reject(err)
        }

        const onClose = () => {
          cleanup()
          reject(new Error('SMTP connection closed unexpectedly'))
        }

        const onData = (chunk: Buffer) => {
          buffer += chunk.toString('utf8')
          const normalized = buffer.replace(/\r\n/g, '\n')
          const lines = normalized.split('\n').filter(Boolean)
          if (lines.length === 0) return
          const lastLine = lines[lines.length - 1]
          if (!/^\d{3} /.test(lastLine)) return
          cleanup()
          resolve(normalized.trim())
        }

        socket.on('data', onData)
        socket.once('error', onError)
        socket.once('close', onClose)
      })

    const sendCommand = async (socket: tls.TLSSocket, command: string, expectedCodes: number[]) => {
      socket.write(`${command}\r\n`)
      const response = await readSmtpResponse(socket)
      const code = Number(response.slice(0, 3))
      if (!expectedCodes.includes(code)) {
        throw new Error(`SMTP command failed (${command}): ${response}`)
      }
      return response
    }

    const socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const client = tls.connect(465, 'smtp.gmail.com', { servername: 'smtp.gmail.com' }, () => resolve(client))
      client.once('error', reject)
    })

    try {
      const greeting = await readSmtpResponse(socket)
      if (!greeting.startsWith('220')) {
        throw new Error(`SMTP greeting failed: ${greeting}`)
      }

      await sendCommand(socket, 'EHLO ayanavita.local', [250])
      await sendCommand(socket, 'AUTH LOGIN', [334])
      await sendCommand(socket, Buffer.from(user).toString('base64'), [334])
      await sendCommand(socket, Buffer.from(pass).toString('base64'), [235])
      await sendCommand(socket, `MAIL FROM:<${user}>`, [250])
      await sendCommand(socket, `RCPT TO:<${to}>`, [250, 251])
      await sendCommand(socket, 'DATA', [354])

      const message = [
        `Subject: ${subject}`,
        `From: AYANAVITA <${user}>`,
        `To: ${to}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        body,
        '.',
      ].join('\r\n')
      socket.write(`${message}\r\n`)
      const dataResponse = await readSmtpResponse(socket)
      if (!dataResponse.startsWith('250')) {
        throw new Error(`SMTP send failed: ${dataResponse}`)
      }

      await sendCommand(socket, 'QUIT', [221])
    } finally {
      socket.end()
    }
  }

  async createServiceReview(data: any) {
    const created = await this.prisma.serviceReview.create({ data })
    const stats = await this.prisma.serviceReview.aggregate({
      where: { serviceId: created.serviceId },
      _avg: { stars: true },
      _count: { id: true },
    })
    await this.prisma.service.update({
      where: { id: created.serviceId },
      data: {
        ratingAvg: stats._avg.stars ?? 5,
      },
    })
    return created
  }

  async deleteServiceReview(id: number) {
    await this.prisma.serviceReview.delete({ where: { id } })
    return { ok: true }
  }

  async upsertRelations(payload: {
    branchService?: Array<{ branchId: number; serviceId: number }>
    specialistBranchService?: Array<{ specialistId: number; branchId: number; serviceId: number }>
  }) {
    const { branchService = [], specialistBranchService = [] } = payload

    for (const item of branchService) {
      await this.prisma.branchService.upsert({
        where: { branchId_serviceId: item },
        update: {},
        create: item,
      })
    }

    for (const item of specialistBranchService) {
      const specialist = await this.prisma.specialist.findUnique({ where: { id: item.specialistId }, select: { id: true, branchId: true } })
      if (!specialist) {
        throw new NotFoundException(`Specialist ${item.specialistId} not found`)
      }
      if (specialist.branchId !== item.branchId) {
        throw new BadRequestException('Specialist can only be assigned to services in their own branch')
      }

      await this.prisma.branchService.upsert({
        where: { branchId_serviceId: { branchId: item.branchId, serviceId: item.serviceId } },
        update: {},
        create: { branchId: item.branchId, serviceId: item.serviceId },
      })

      await this.prisma.specialistBranchService.upsert({
        where: { specialistId_branchId_serviceId: item },
        update: {},
        create: item,
      })
    }

    return { ok: true, branchService: branchService.length, specialistBranchService: specialistBranchService.length }
  }
}
