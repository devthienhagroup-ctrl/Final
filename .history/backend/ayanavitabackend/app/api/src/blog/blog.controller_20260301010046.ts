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
import { Roles } from '../auth/decorators/roles.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  listAdmin(@Query() query: BlogQueryDto) {
    return this.blogService.listAdmin(query)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/view-trackers/cleanup')
  runCleanup(@CurrentUser() user: JwtUser) {
    return this.blogService.triggerCleanup(user)
  }
}
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
import { Roles } from '../auth/decorators/roles.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  listAdmin(@Query() query: BlogQueryDto) {
    return this.blogService.listAdmin(query)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/view-trackers/cleanup')
  runCleanup(@CurrentUser() user: JwtUser) {
    return this.blogService.triggerCleanup(user)
  }
}
