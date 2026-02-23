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

  // Update progress trong lúc học (idempotent)
  // POST /lessons/:id/progress
  // body: { lastPositionSec?: number, percent?: number }
  @Post('lessons/:id/progress')
  upsert(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertProgressDto,
  ) {
    return this.progress.upsertLessonProgress(user, id, dto)
  }

  // Mark complete (shortcut)
  // POST /lessons/:id/complete
  @Post('lessons/:id/complete')
  complete(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.progress.completeLesson(user, id)
  }

  // Progress list của user (My learning)
  // GET /me/progress
  @Get('me/progress')
  my(@CurrentUser() user: JwtUser) {
    return this.progress.myProgress(user.sub)
  }

  // Course progress (để FE Continue đúng bài đang dở)
  // GET /me/courses/:courseId/progress
  @Get('me/courses/:courseId/progress')
  courseProgress(
    @CurrentUser() user: JwtUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.progress.getCourseProgress(user, courseId)
  }
}
