import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ImageUploadService } from '../services/ImageUploadService'
import { BlogController } from './blog.controller'
import { BlogService } from './blog.service'

@Module({
  imports: [PrismaModule],
  controllers: [BlogController],
  providers: [BlogService, ImageUploadService],
})
export class BlogModule {}
import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ImageUploadService } from '../services/ImageUploadService'
import { BlogController } from './blog.controller'
import { BlogService } from './blog.service'

@Module({
  imports: [PrismaModule],
  controllers: [BlogController],
  providers: [BlogService, ImageUploadService],
})
export class BlogModule {}
