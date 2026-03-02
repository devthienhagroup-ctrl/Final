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
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import type { Request } from 'express'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CreateReviewDto } from './dto/create-review.dto'
import { HelpfulHistoryQueryDto, MergeHelpfulDto } from './dto/review-helpful.dto'
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
    return this.reviewsService.createReview(dto, req, files || [])
  }
  @UseGuards(AccessTokenGuard)
  @Post(':id/helpful/toggle')
  toggleHelpful(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.reviewsService.toggleHelpful(id, user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Get('my-helpful-reviews')
  myHelpfulReviews(@CurrentUser() user: JwtUser, @Query() query: HelpfulHistoryQueryDto) {
    return this.reviewsService.listMyHelpfulReviews(user.sub, query)
  }

  @UseGuards(AccessTokenGuard)
  @Post('helpful/merge-local')
  mergeLocalHelpful(@CurrentUser() user: JwtUser, @Body() dto: MergeHelpfulDto) {
    return this.reviewsService.mergeLocalHelpful(user.sub, dto.reviewIds || [])
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

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('support.manage')
  @Patch('admin/:id/show')
  adminShow(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.adminShow(id)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('support.manage')
  @Patch('admin/:id/spam')
  adminSpam(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.adminSpam(id)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('support.manage')
  @Patch('admin/:id/unspam')
  adminUnspam(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.adminUnspam(id)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('support.manage')
  @Patch('admin/bulk')
  adminBulk(
    @Body() body: { ids?: number[]; action?: 'show' | 'hide' | 'spam' | 'unspam' | 'delete' },
  ) {
    const action = body?.action
    const ids = (body?.ids || []).filter((x) => Number.isInteger(Number(x))).map((x) => Number(x))
    if (!action || !ids.length) throw new BadRequestException('Thiếu action hoặc ids')
    return this.reviewsService.adminBulk(ids, action)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('support.manage')
  @Delete('admin/:id')
  adminDelete(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.adminDelete(id)
  }
}
