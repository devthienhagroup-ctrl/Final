import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { promises as fs } from 'fs'
import { createHash, createHmac } from 'crypto'
import { extname, join } from 'path'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import {
  BranchResponseDto,
  ServiceCatalogItemDto,
  ServiceResponseDto,
  ServiceReviewResponseDto,
  SpecialistResponseDto,
  TempImageResponseDto,
} from './dto/booking-response.dto'

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly s3Bucket = process.env.CLOUDFLY_BUCKET || 'ayanavita-dev'
  private readonly s3Region = process.env.CLOUDFLY_REGION || 'auto'
  private readonly s3Endpoint = process.env.CLOUDFLY_ENDPOINT || 'https://s3.cloudfly.vn'
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

  private presignCloudReadUrl(key: string, expiresInSeconds = 1800) {
    const endpoint = this.s3Endpoint.replace(/\/$/, '')
    const host = new URL(endpoint).host
    const now = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = now.slice(0, 8)
    const credentialScope = `${dateStamp}/${this.s3Region}/s3/aws4_request`

    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      'X-Amz-Credential': `${this.s3AccessKey}/${credentialScope}`,
      'X-Amz-Date': now,
      'X-Amz-Expires': String(expiresInSeconds),
      'X-Amz-SignedHeaders': 'host',
      'x-amz-checksum-mode': 'ENABLED',
      'x-id': 'GetObject',
    })

    const canonicalQuery = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')

    const canonicalRequest = [
      'GET',
      `/${this.s3Bucket}/${key}`,
      canonicalQuery,
      `host:${host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n')

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      now,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n')

    const kDate = this.hmac(`AWS4${this.s3SecretKey}`, dateStamp)
    const kRegion = this.hmac(kDate, this.s3Region)
    const kService = this.hmac(kRegion, 's3')
    const kSigning = this.hmac(kService, 'aws4_request')
    const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')

    return `${endpoint}/${this.s3Bucket}/${key}?${canonicalQuery}&X-Amz-Signature=${signature}`
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

    const canonicalHeaders = `host:${endpointHost}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
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
      headers['content-type'] = file.mimetype || 'image/jpeg'
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
      url: this.presignCloudReadUrl(key),
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

  async listServicesCatalog(): Promise<ServiceCatalogItemDto[]> {
    const rows = await this.prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        goals: true,
        suitableFor: true,
        durationMin: true,
        price: true,
        ratingAvg: true,
        bookedCount: true,
        imageUrl: true,
        tag: true,
      },
      orderBy: { id: 'asc' },
    })

    return rows.map((s) => ({
      id: s.code,
      dbId: s.id,
      name: s.name,
      cat: s.category ?? 'health',
      goal: this.toStringArray(s.goals),
      duration: s.durationMin,
      price: s.price,
      rating: s.ratingAvg,
      booked: s.bookedCount,
      img: s.imageUrl,
      tag: s.tag ?? 'Spa',
    }))
  }

  async listBranches(includeInactive = false): Promise<BranchResponseDto[]> {
    const rows = await this.prisma.branch.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: { id: true, code: true, name: true, address: true, phone: true, isActive: true },
      orderBy: { id: 'asc' },
    })

    return rows.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      address: b.address,
      phone: b.phone,
      isActive: b.isActive,
    }))
  }

  async listServices(branchId?: number): Promise<ServiceResponseDto[]> {
    const rows = await this.prisma.service.findMany({
      where: {
        isActive: true,
        ...(branchId ? { branches: { some: { branchId } } } : {}),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        goals: true,
        suitableFor: true,
        durationMin: true,
        price: true,
        ratingAvg: true,
        bookedCount: true,
        tag: true,
        imageUrl: true,
        branches: { select: { branchId: true } },
      },
      orderBy: { id: 'asc' },
    })

    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description,
      category: s.category,
      goals: this.toStringArray(s.goals),
      suitableFor: this.toStringArray(s.suitableFor),
      durationMin: s.durationMin,
      price: s.price,
      ratingAvg: s.ratingAvg,
      bookedCount: s.bookedCount,
      tag: s.tag,
      imageUrl: s.imageUrl,
      branchIds: s.branches.map((b) => b.branchId),
    }))
  }

  async listSpecialists(branchId?: number, serviceId?: number): Promise<SpecialistResponseDto[]> {
    const rows = await this.prisma.specialist.findMany({
      where: {
        isActive: true,
        ...(branchId ? { branches: { some: { branchId } } } : {}),
        ...(serviceId ? { services: { some: { serviceId } } } : {}),
      },
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
        bio: true,
        branches: { select: { branchId: true } },
        services: { select: { serviceId: true } },
      },
      orderBy: { id: 'asc' },
    })

    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      level: s.level,
      bio: s.bio,
      branchIds: s.branches.map((b) => b.branchId),
      serviceIds: s.services.map((srv) => srv.serviceId),
    }))
  }


  listAppointments(userId?: number) {
    return this.prisma.appointment.findMany({
      where: userId ? { userId } : {},
      include: {
        branch: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMin: true, price: true } },
        specialist: { select: { id: true, name: true, level: true } },
      },
      orderBy: { appointmentAt: 'desc' },
    })
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
      const specialist = await this.prisma.specialist.findUnique({ where: { id: dto.specialistId } })
      if (!specialist) throw new NotFoundException('Specialist not found')

      const [branchLink, serviceLink] = await Promise.all([
        this.prisma.branchSpecialist.findUnique({
          where: { branchId_specialistId: { branchId: dto.branchId, specialistId: dto.specialistId } },
        }),
        this.prisma.serviceSpecialist.findUnique({
          where: { serviceId_specialistId: { serviceId: dto.serviceId, specialistId: dto.specialistId } },
        }),
      ])

      if (!branchLink || !serviceLink) {
        throw new BadRequestException('Specialist is not available for branch/service')
      }
    }

    const created = await this.prisma.appointment.create({
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
        userId: dto.userId,
      },
      include: {
        branch: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMin: true, price: true } },
        specialist: { select: { id: true, name: true, level: true } },
      },
    })

    return created
  }

  async updateAppointment(id: number, data: any) {
    return this.prisma.appointment.update({ where: { id }, data })
  }

  async deleteAppointment(id: number) {
    await this.prisma.appointment.delete({ where: { id } })
    return { ok: true }
  }


  private normalizeServiceCode(name?: string) {
    const base = (name || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    return `SRV_${base || Date.now()}`
  }

  private sanitizeServiceData(data: any) {
    const goalsInput = Array.isArray(data.goals) ? data.goals : []
    const suitableForInput = Array.isArray(data.suitableFor) ? data.suitableFor : []
    return {
      code: data.code || this.normalizeServiceCode(data.name),
      name: data.name,
      description: data.description,
      category: data.category,
      goals: goalsInput,
      suitableFor: suitableForInput,
      durationMin: Number(data.durationMin ?? 60),
      price: Number(data.price ?? 0),
      tag: data.tag,
    }
  }

  async createService(data: any, file?: any) {
    let imageUrl: string | undefined
    if (file) {
      const uploaded = await this.uploadImageToCloud(file)
      imageUrl = uploaded.url
    }
    return this.prisma.service.create({ data: { ...this.sanitizeServiceData(data), imageUrl } })
  }

  async updateService(id: number, data: any, file?: any) {
    const existing = await this.prisma.service.findUnique({ where: { id }, select: { imageUrl: true } })
    if (!existing) throw new NotFoundException('Service not found')

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

    return this.prisma.service.update({ where: { id }, data: { ...this.sanitizeServiceData(data), imageUrl } })
  }

  async deleteService(id: number) {
    await this.prisma.service.delete({ where: { id } })
    return { ok: true }
  }

  async createBranch(data: any) {
    return this.prisma.branch.create({ data })
  }

  async updateBranch(id: number, data: any) {
    return this.prisma.branch.update({ where: { id }, data })
  }

  async deleteBranch(id: number) {
    const [branchServiceCount, branchSpecialistCount, appointmentCount] = await Promise.all([
      this.prisma.branchService.count({ where: { branchId: id } }),
      this.prisma.branchSpecialist.count({ where: { branchId: id } }),
      this.prisma.appointment.count({ where: { branchId: id } }),
    ])

    const linkedCount = branchServiceCount + branchSpecialistCount + appointmentCount
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
    return this.prisma.specialist.create({ data })
  }

  async updateSpecialist(id: number, data: any) {
    return this.prisma.specialist.update({ where: { id }, data })
  }

  async deleteSpecialist(id: number) {
    await this.prisma.specialist.delete({ where: { id } })
    return { ok: true }
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
    serviceSpecialist?: Array<{ serviceId: number; specialistId: number }>
    branchSpecialist?: Array<{ branchId: number; specialistId: number }>
  }) {
    const { branchService = [], serviceSpecialist = [], branchSpecialist = [] } = payload

    for (const item of branchService) {
      await this.prisma.branchService.upsert({
        where: { branchId_serviceId: item },
        update: {},
        create: item,
      })
    }
    for (const item of serviceSpecialist) {
      await this.prisma.serviceSpecialist.upsert({
        where: { serviceId_specialistId: item },
        update: {},
        create: item,
      })
    }
    for (const item of branchSpecialist) {
      await this.prisma.branchSpecialist.upsert({
        where: { branchId_specialistId: item },
        update: {},
        create: item,
      })
    }

    return { ok: true, branchService: branchService.length, serviceSpecialist: serviceSpecialist.length, branchSpecialist: branchSpecialist.length }
  }
}
