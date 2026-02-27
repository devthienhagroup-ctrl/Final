import { Module } from '@nestjs/common'
import { CoursesController } from './courses.controller'
import { CoursesService } from './courses.service'
import { PrismaModule } from '../prisma/prisma.module'
import { EnrollmentsModule } from '../enrollments/enrollments.module'
import { CoursesMediaService } from './courses-media.service'

@Module({
  imports: [PrismaModule, EnrollmentsModule], // ✅ BẮT BUỘC
  controllers: [CoursesController],
  providers: [CoursesService, CoursesMediaService],
  exports: [CoursesService],
})
export class CoursesModule {}
