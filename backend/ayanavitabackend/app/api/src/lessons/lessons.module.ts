import { Module } from '@nestjs/common'
import { LessonsController } from './lessons.controller'
import { LessonsService } from './lessons.service'
import { PrismaModule } from '../prisma/prisma.module'
import { EnrollmentsModule } from '../enrollments/enrollments.module'
import { LessonsMediaService } from './lessons-media.service'


@Module({
  imports: [PrismaModule, EnrollmentsModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonsMediaService],
  exports: [LessonsService],
})
export class LessonsModule {}
