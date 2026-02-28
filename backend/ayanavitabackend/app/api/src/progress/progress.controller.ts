import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ProgressService } from './progress.service'
import { UpsertProgressDto } from './dto/upsert-progress.dto'

type JwtUser = { sub: number; role: string }

@UseGuards(AccessTokenGuard)
@Controller()
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Post('lessons/:id/progress')
  upsert(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertProgressDto,
  ) {
    return this.progress.upsertLessonProgress(user, id, dto)
  }

  @Post('lessons/:id/videos/:videoId/progress')
  upsertVideoProgress(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) lessonId: number,
    @Param('videoId', ParseIntPipe) videoId: number,
    @Body() dto: UpsertProgressDto,
  ) {
    return this.progress.upsertVideoProgress(user, lessonId, videoId, dto)
  }

  @Post('lessons/:id/modules/:moduleId/complete')
  completeModule(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) lessonId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    return this.progress.completeModule(user, lessonId, moduleId)
  }

  @Post('lessons/:id/complete')
  complete(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.progress.completeLesson(user, id)
  }

  @Get('me/progress')
  my(@CurrentUser() user: JwtUser) {
    return this.progress.myProgress(user.sub)
  }

  @Get('me/courses/:courseId/progress')
  courseProgress(
    @CurrentUser() user: JwtUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.progress.getCourseProgress(user, courseId)
  }
}
