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
  UseInterceptors,
  UseGuards,
} from '@nestjs/common'
import { LessonsService } from './lessons.service'
import { CreateLessonDto } from './dto/create-lesson.dto'
import { UpdateLessonDto } from './dto/update-lesson.dto'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'

@UseGuards(AccessTokenGuard) // bắt buộc đăng nhập cho toàn controller
@Controller()
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  // USER/ADMIN: xem chi tiết lesson
  // Rule: USER chỉ xem được khi Enrollment ACTIVE; ADMIN bypass
  @Get('lessons/:id')
  findOne(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: string,
  ) {
    return this.lessons.findOne(user, id, lang)
  }

  // ADMIN: tạo lesson trong course
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('courses/:courseId/lessons')
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessons.create(courseId, dto)
  }


  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('lessons/:id/modules/:moduleId/media/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadModuleMedia(
    @Param('id', ParseIntPipe) lessonId: number,
    @Param('moduleId') moduleId: string,
    @UploadedFile() file?: any,
    @Body('type') type?: string,
    @Body('order') order?: string,
  ) {
    if (!file) return { message: 'Missing media file' }
    const parsedOrder = Number(order)
    return this.lessons.uploadModuleMedia(
      lessonId,
      moduleId,
      type === 'image' ? 'image' : 'video',
      file,
      Number.isFinite(parsedOrder) ? parsedOrder : undefined,
    )
  }

  // ADMIN: update lesson
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('lessons/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessons.update(id, dto)
  }

  // ADMIN: delete lesson
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete('lessons/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessons.remove(id)
  }
}
