import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { promises as fs } from 'fs'
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

  async listBranches(): Promise<BranchResponseDto[]> {
    const rows = await this.prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, address: true, phone: true },
      orderBy: { id: 'asc' },
    })

    return rows.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      address: b.address,
      phone: b.phone,
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
        durationMin: true,
        price: true,
        ratingAvg: true,
        bookedCount: true,
        tag: true,
        icon: true,
        imageUrl: true,
        heroImageUrl: true,
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
      durationMin: s.durationMin,
      price: s.price,
      ratingAvg: s.ratingAvg,
      bookedCount: s.bookedCount,
      tag: s.tag,
      icon: s.icon,
      imageUrl: s.imageUrl,
      heroImageUrl: s.heroImageUrl,
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
}
