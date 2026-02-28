import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from '../prisma/prisma.module'
import { ImageUploadService } from '../services/ImageUploadService'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ReviewsController],
  providers: [ReviewsService, ImageUploadService],
})
export class ReviewsModule {}
