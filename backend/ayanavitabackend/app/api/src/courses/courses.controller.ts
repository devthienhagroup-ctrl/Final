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
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { OptionalAccessTokenGuard } from '../auth/guards/optional-access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CoursesService } from './courses.service'
import { CourseQueryDto } from './dto/course-query.dto'

type JwtUser = { sub: number; role: string }


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
  listLessons(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.courses.listLessons(user, id)
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

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('thumbnail/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadThumbnail(@UploadedFile() file?: any) {
    if (!file) return { message: 'Missing thumbnail file' }
    return this.courses.uploadThumbnail(file)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail', { storage: memoryStorage() }))
  create(@Body() rawData: any, @UploadedFile() thumbnail?: any) {
    return this.courses.create(parseMultipartData(rawData) as CreateCourseDto, thumbnail)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail', { storage: memoryStorage() }))
  update(@Param('id', ParseIntPipe) id: number, @Body() rawData: any, @UploadedFile() thumbnail?: any) {
    return this.courses.update(id, parseMultipartData(rawData) as UpdateCourseDto, thumbnail)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courses.remove(id)
  }
}
