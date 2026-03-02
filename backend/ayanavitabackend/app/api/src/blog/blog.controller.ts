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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import type { Request } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { BlogService } from './blog.service'
import { BlogQueryDto } from './dto/blog-query.dto'
import { CreateBlogPostDto } from './dto/create-blog-post.dto'
import { MergeSavedPostsDto } from './dto/merge-saved-posts.dto'
import { UpdateBlogPostDto } from './dto/update-blog-post.dto'

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('public')
  listPublic(@Query() query: BlogQueryDto) {
    return this.blogService.listPublic(query)
  }

  @Get('public/:id')
  detailPublic(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.blogService.detailPublic(id, req)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('cms.read')
  @Get('admin')
  listAdmin(@Query() query: BlogQueryDto) {
    return this.blogService.listAdmin(query)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('cms.write')
  @Post('admin')
  @UseInterceptors(
    FileInterceptor('coverImageFile', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateBlogPostDto,
    @UploadedFile() file?: any,
  ) {
    return this.blogService.create(user, dto, file)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('cms.write')
  @Patch('admin/:id')
  @UseInterceptors(
    FileInterceptor('coverImageFile', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogPostDto, @UploadedFile() file?: any) {
    return this.blogService.update(id, dto, file)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('cms.manage')
  @Delete('admin/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.remove(id)
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/save/toggle')
  toggleSave(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.blogService.toggleSave(user.sub, id)
  }

  @UseGuards(AccessTokenGuard)
  @Get('me/saved')
  mySaved(@CurrentUser() user: JwtUser) {
    return this.blogService.mySaved(user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Post('me/saved/merge')
  mergeSaved(@CurrentUser() user: JwtUser, @Body() dto: MergeSavedPostsDto) {
    return this.blogService.mergeSaved(user.sub, dto.blogIds)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('cms.manage')
  @Post('admin/view-trackers/cleanup')
  runCleanup(@CurrentUser() user: JwtUser) {
    return this.blogService.triggerCleanup(user)
  }
}
