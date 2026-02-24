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
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { BookingService } from './booking.service'
import { BookingFilterQueryDto } from './dto/booking-query.dto'
import { CreateAppointmentDto } from './dto/create-appointment.dto'

@Controller('booking')
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  @Get('services-page')
  servicesPage() {
    return this.booking.listServicesCatalog()
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
  branches(@Query('includeInactive') includeInactive?: string) {
    return this.booking.listBranches(includeInactive === 'true')
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
    return this.booking.listServices(query.branchId)
  }

  @Post('services')
  createService(@Body() data: any) {
    return this.booking.createService(data)
  }

  @Patch('services/:id')
  updateService(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.booking.updateService(id, data)
  }

  @Delete('services/:id')
  deleteService(@Param('id', ParseIntPipe) id: number) {
    return this.booking.deleteService(id)
  }

  @Get('specialists')
  specialists(@Query() query: BookingFilterQueryDto) {
    return this.booking.listSpecialists(query.branchId, query.serviceId)
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

  @Get('appointments')
  appointments(@Query() query: BookingFilterQueryDto) {
    return this.booking.listAppointments(query.userId)
  }

  @Patch('appointments/:id')
  updateAppointment(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.booking.updateAppointment(id, data)
  }

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
