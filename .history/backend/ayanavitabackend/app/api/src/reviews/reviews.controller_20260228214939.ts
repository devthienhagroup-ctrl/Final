import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import type { Request } from 'express'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CreateReviewDto } from './dto/create-review.dto'
import { AdminReviewsQueryDto, PublicReviewsQueryDto } from './dto/reviews-query.dto'
import { ReviewsService } from './reviews.service'

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('branches')
  branches() {
    return this.reviewsService.listBranches()
  }

  @Get('services')
  services(@Query('branchId') branchId?: string) {
    const parsed = branchId ? Number(branchId) : undefined
    return this.reviewsService.listServices(parsed)
  }

  @UseGuards(AccessTokenGuard)
  @Get('my-product-reviewables')
  myProductReviewables(@CurrentUser() user: JwtUser, @Query('branchId') branchId?: string) {
    const parsed = branchId ? Number(branchId) : undefined
    return this.reviewsService.listMyReviewableProducts(user.sub, parsed)
  }

  @Get()
  listPublic(@Query() query: PublicReviewsQueryDto) {
    return this.reviewsService.listPublic(query)
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(@Body() dto: CreateReviewDto, @Req() req: Request, @UploadedFiles() files?: any[]) {
      console.log('RAW req.body:', req.body)
      console.log('RAW anonymous value/type:', (req.body as any).anonymous, typeof (req.body as any).anonymous)
      console.log('DTO anonymous value/type:', dto.anonymous, typeof dto.anonymous)
    return this.reviewsService.createReview(dto, req, files || [])
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/list')
  adminList(@Query() query: AdminReviewsQueryDto) {
    return this.reviewsService.adminList(query)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id/hide')
  adminHide(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.adminHide(id)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/:id')
  adminDelete(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.adminDelete(id)
  }
}
