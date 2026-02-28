import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { BookingService } from './booking.service'
import { AppointmentStatsQueryDto, BookingFilterQueryDto } from './dto/booking-query.dto'
import { CreateAppointmentDto } from './dto/create-appointment.dto'


const parseMultipartData = (input: Record<string, any>) => {
  const data = { ...input }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          data[key] = JSON.parse(trimmed)
        } catch {
          data[key] = value
        }
      }
    }
  }
  return data
}


@Controller('booking')
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  @Get('services-page')
  servicesPage(@Query('lang') lang?: string) {
    return this.booking.listServicesCatalog(lang)
  }

  @Post('images/temp')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadTempImage(@UploadedFile() file?: any) {
    if (!file) throw new BadRequestException('file is required')
    return this.booking.saveTempImage(file)
  }

  @Post('images/cloud')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadCloudImage(@UploadedFile() file?: any) {
    if (!file) throw new BadRequestException('file is required')
    return this.booking.uploadImageToCloud(file)
  }

  @Delete('images/temp/:fileName')
  deleteTempImage(@Param('fileName') fileName: string) {
    return this.booking.deleteTempImage(fileName)
  }

  @Delete('images/cloud')
  deleteCloudImage(@Body() input: { fileName?: string; url?: string }) {
    return this.booking.deleteCloudImage(input)
  }

  @Get('branches')
  branches(@Query('includeInactive') includeInactive?: string, @Query('serviceId') serviceId?: string, @Query('lang') lang?: string) {
    let parsedServiceId: number | undefined
    if (serviceId !== undefined) {
      parsedServiceId = Number(serviceId)
      if (!Number.isInteger(parsedServiceId) || parsedServiceId < 1) {
        throw new BadRequestException('serviceId must be a positive integer')
      }
    }
    return this.booking.listBranches(includeInactive === 'true', parsedServiceId, lang)
  }

  @Post('branches')
  createBranch(@Body() data: any) {
    return this.booking.createBranch(data)
  }

  @Patch('branches/:id')
  updateBranch(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.booking.updateBranch(id, data)
  }

  @Delete('branches/:id')
  deleteBranch(@Param('id', ParseIntPipe) id: number) {
    return this.booking.deleteBranch(id)
  }

  @Get('services')
  services(@Query() query: BookingFilterQueryDto) {
    return this.booking.listServices({
      branchId: query.branchId,
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
      includeInactive: query.includeInactive,
      lang: query.lang,
    })
  }

  @Get('services/:id')
  serviceDetail(@Param('id', ParseIntPipe) id: number, @Query('lang') lang?: string) {
    return this.booking.getServiceDetail(id, lang)
  }

  @Post('services')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  createService(@Body() data: any, @UploadedFile() file?: any) {
    return this.booking.createService(parseMultipartData(data), file)
  }

  @Patch('services/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  updateService(@Param('id', ParseIntPipe) id: number, @Body() data: any, @UploadedFile() file?: any) {
    return this.booking.updateService(id, parseMultipartData(data), file)
  }

  @Delete('services/:id')
  deleteService(@Param('id', ParseIntPipe) id: number) {
    return this.booking.deleteService(id)
  }

  @Get('service-categories')
  serviceCategories(@Query('lang') lang?: string) {
    return this.booking.listServiceCategories(lang)
  }

  @Post('service-categories')
  createServiceCategory(@Body() data: any) {
    return this.booking.createServiceCategory(data)
  }

  @Patch('service-categories/:id')
  updateServiceCategory(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.booking.updateServiceCategory(id, data)
  }

  @Delete('service-categories/:id')
  deleteServiceCategory(@Param('id', ParseIntPipe) id: number) {
    return this.booking.deleteServiceCategory(id)
  }

  @Get('specialists')
  specialists(@Query() query: BookingFilterQueryDto) {
    return this.booking.listSpecialists(query.branchId, query.serviceId, query.lang)
  }

  @Post('specialists')
  createSpecialist(@Body() data: any) {
    return this.booking.createSpecialist(data)
  }

  @Patch('specialists/:id')
  updateSpecialist(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.booking.updateSpecialist(id, data)
  }

  @Delete('specialists/:id')
  deleteSpecialist(@Param('id', ParseIntPipe) id: number) {
    return this.booking.deleteSpecialist(id)
  }


  @Get('slot-suggestions')
  slotSuggestions(
    @Query('branchId') branchId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    const parsedBranchId = Number(branchId)
    const parsedServiceId = Number(serviceId)
    if (!Number.isInteger(parsedBranchId) || parsedBranchId < 1) {
      throw new BadRequestException('branchId must be a positive integer')
    }
    if (!Number.isInteger(parsedServiceId) || parsedServiceId < 1) {
      throw new BadRequestException('serviceId must be a positive integer')
    }
    if (!date) {
      throw new BadRequestException('date is required')
    }

    return this.booking.getSlotSuggestions(parsedBranchId, parsedServiceId, date)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('appointments')
  appointments(@CurrentUser() user: JwtUser) {
    return this.booking.listAppointments(user)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('appointments/stats')
  appointmentStats(@Query() query: AppointmentStatsQueryDto, @CurrentUser() user: JwtUser) {
    return this.booking.getAppointmentStats(query, user)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch('appointments/:id')
  updateAppointment(@Param('id', ParseIntPipe) id: number, @Body() data: any, @CurrentUser() user: JwtUser) {
    return this.booking.updateAppointment(id, data, user)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('appointments/:id')
  deleteAppointment(@Param('id', ParseIntPipe) id: number) {
    return this.booking.deleteAppointment(id)
  }

  @Get('service-reviews')
  serviceReviews(@Query() query: BookingFilterQueryDto) {
    return this.booking.listServiceReviews(query.serviceId)
  }

  @Post('service-reviews')
  createServiceReview(@Body() data: any) {
    return this.booking.createServiceReview(data)
  }

  @Delete('service-reviews/:id')
  deleteServiceReview(@Param('id', ParseIntPipe) id: number) {
    return this.booking.deleteServiceReview(id)
  }

  @Post('relations/sync')
  syncRelations(@Body() payload: any) {
    return this.booking.upsertRelations(payload)
  }

  @Post('appointments')
  createAppointment(@Body() dto: CreateAppointmentDto) {
    return this.booking.createAppointment(dto)
  }
}
