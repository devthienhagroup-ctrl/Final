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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CreateCourseDto } from './dto/create-course.dto'
import { UpdateCourseDto } from './dto/update-course.dto'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { OptionalAccessTokenGuard } from '../auth/guards/optional-access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { CoursesService } from './courses.service'
import { CourseQueryDto } from './dto/course-query.dto'
import { UpsertCourseReviewDto } from './dto/upsert-course-review.dto'

const parseMultipartData = (input: Record<string, any>) => {
  const data = { ...input }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed === 'true' || trimmed === 'false') {
      data[key] = trimmed === 'true'
      continue
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && key !== 'slug') {
      data[key] = Number(trimmed)
      continue
    }
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        data[key] = JSON.parse(trimmed)
      } catch {
        data[key] = value
      }
    }
  }
  return data
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @UseGuards(AccessTokenGuard)
  @Get(':id/lessons-outline')
  lessonsOutline(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: string,
  ) {
    return this.courses.lessonsOutline(user, id, lang)
  }

  @Get()
  @UseGuards(OptionalAccessTokenGuard)
  findAll(@CurrentUser() user: JwtUser | null, @Query() query: CourseQueryDto) {
    return this.courses.findAll(query, user)
  }

  @Get('topics')
  @UseGuards(OptionalAccessTokenGuard)
  listTopics(@CurrentUser() user: JwtUser | null, @Query('lang') lang?: string) {
    return this.courses.listTopics(lang, user)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Query('lang') lang?: string) {
    return this.courses.findOne(id, lang)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/lessons')
  listLessons(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number, @Query('lang') lang?: string) {
    return this.courses.listLessons(user, id, lang)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/reviews')
  listReviews(@Param('id', ParseIntPipe) id: number) {
    return this.courses.listReviews(id)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('courses.write')
  @Delete(':id/reviews/:reviewId')
  async deleteReview(
    @Param('id', ParseIntPipe) id: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    return this.courses.deleteReview(id, reviewId)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('courses.write')
  @Get(':id/students')
  listStudents(@Param('id', ParseIntPipe) id: number) {
    return this.courses.listStudents(id)
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/reviews')
  upsertReview(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertCourseReviewDto,
  ) {
    return this.courses.upsertReview(user, id, dto)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/lessons/:lessonId')
  getLesson(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.courses.getLessonDetail(user, courseId, lessonId)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('courses.write')
  @Post('thumbnail/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadThumbnail(@UploadedFile() file?: any) {
    if (!file) return { message: 'Missing thumbnail file' }
    return this.courses.uploadThumbnail(file)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('courses.write')
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail', { storage: memoryStorage() }))
  create(@CurrentUser() user: JwtUser, @Body() rawData: any, @UploadedFile() thumbnail?: any) {
    return this.courses.create(parseMultipartData(rawData) as CreateCourseDto, thumbnail, user.sub)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('courses.write')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail', { storage: memoryStorage() }))
  update(@Param('id', ParseIntPipe) id: number, @Body() rawData: any, @UploadedFile() thumbnail?: any) {
    return this.courses.update(id, parseMultipartData(rawData) as UpdateCourseDto, thumbnail)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('courses.manage')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courses.remove(id)
  }
}
