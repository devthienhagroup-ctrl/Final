import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CourseQueryDto } from '../courses/dto/course-query.dto'
import { CreateCourseDto } from '../courses/dto/create-course.dto'
import { UpdateCourseDto } from '../courses/dto/update-course.dto'
import { CoursesService } from '../courses/courses.service'
import { LessonsService } from '../lessons/lessons.service'
import { CreateLessonDto } from '../lessons/dto/create-lesson.dto'
import { UpdateLessonDto } from '../lessons/dto/update-lesson.dto'
import { PrismaService } from '../prisma/prisma.service'
import { CourseTopicsService } from '../course-topics/course-topics.service'

type MultipartBody = Record<string, any>
const parseMultipartData = (input: MultipartBody) => {
  const data = { ...input }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed === 'true' || trimmed === 'false') { data[key] = trimmed === 'true'; continue }
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && key !== 'slug') { data[key] = Number(trimmed); continue }
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try { data[key] = JSON.parse(trimmed) } catch { data[key] = value }
    }
  }
  return data
}

@UseGuards(AccessTokenGuard, RolesGuard)
@Roles('MANAGER')
@Controller('instructor')
export class InstructorController {
  constructor(
    private readonly courses: CoursesService,
    private readonly lessons: LessonsService,
    private readonly prisma: PrismaService,
    private readonly courseTopics: CourseTopicsService,
  ) {}

  @Get('course-topics')
  listTopics() {
    return this.courseTopics.list()
  }

  @Get('courses')
  findCourses(@CurrentUser() user: JwtUser, @Query() query: CourseQueryDto) {
    return this.courses.findAllByCreator(query, user.sub)
  }

  @Get('courses/:id')
  async findCourse(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Query('lang') lang?: string) {
    await this.courses.assertCreator(id, user.sub)
    return this.courses.findOne(id, lang)
  }

  @Get('courses/:id/lessons-outline')
  async lessonsOutline(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Query('lang') lang?: string) {
    await this.courses.assertCreator(id, user.sub)
    return this.courses.lessonsOutline({ sub: user.sub, role: 'ADMIN' }, id, lang)
  }

  @Post('courses')
  @UseInterceptors(FileInterceptor('thumbnail', { storage: memoryStorage() }))
  createCourse(@CurrentUser() user: JwtUser, @Body() rawData: any, @UploadedFile() thumbnail?: any) {
    return this.courses.create(parseMultipartData(rawData) as CreateCourseDto, thumbnail, user.sub)
  }

  @Patch('courses/:id')
  @UseInterceptors(FileInterceptor('thumbnail', { storage: memoryStorage() }))
  async updateCourse(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() rawData: any, @UploadedFile() thumbnail?: any) {
    await this.courses.assertCreator(id, user.sub)
    return this.courses.update(id, parseMultipartData(rawData) as UpdateCourseDto, thumbnail)
  }

  @Delete('courses/:id')
  async deleteCourse(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    await this.courses.assertCreator(id, user.sub)
    return this.courses.remove(id)
  }

  @Get('lessons/:id')
  async lessonDetail(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Query('lang') lang?: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id }, select: { id: true, courseId: true } })
    if (!lesson) return this.lessons.findOne({ ...user, role: 'ADMIN' }, id, lang)
    await this.courses.assertCreator(lesson.courseId, user.sub)
    return this.lessons.findOne({ ...user, role: 'ADMIN' }, id, lang)
  }

  @Post('courses/:courseId/lessons')
  async createLesson(@CurrentUser() user: JwtUser, @Param('courseId', ParseIntPipe) courseId: number, @Body() dto: CreateLessonDto) {
    await this.courses.assertCreator(courseId, user.sub)
    return this.lessons.create(courseId, dto)
  }

  @Patch('lessons/:id')
  async updateLesson(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id }, select: { courseId: true } })
    if (!lesson) return this.lessons.update(id, dto)
    await this.courses.assertCreator(lesson.courseId, user.sub)
    return this.lessons.update(id, dto)
  }

  @Delete('lessons/:id')
  async deleteLesson(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id }, select: { courseId: true } })
    if (!lesson) return this.lessons.remove(id)
    await this.courses.assertCreator(lesson.courseId, user.sub)
    return this.lessons.remove(id)
  }

  @Post('lessons/:id/modules/:moduleId/media/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadLessonMedia(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) lessonId: number,
    @Param('moduleId') moduleId: string,
    @UploadedFile() file?: any,
    @Body('type') type?: string,
    @Body('order') order?: string,
  ) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }, select: { courseId: true } })
    if (lesson) await this.courses.assertCreator(lesson.courseId, user.sub)
    const parsedOrder = Number(order)
    return this.lessons.uploadModuleMedia(lessonId, moduleId, type === 'image' ? 'image' : 'video', file, Number.isFinite(parsedOrder) ? parsedOrder : undefined)
  }
}
