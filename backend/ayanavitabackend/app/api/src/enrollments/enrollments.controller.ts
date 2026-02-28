import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { EnrollmentsService } from './enrollments.service'
import { CourseAccessStatus } from '@prisma/client'

@UseGuards(AccessTokenGuard)
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  /**
   * Danh sách khóa học đã mua + progress
   */
  @Get('me/courses')
  myCourses(@CurrentUser() user: JwtUser, @Query('lang') lang?: string) {
    return this.enrollments.myCoursesWithProgress(user, lang)
  }
  // route mới: GET /me/enrollments?status=ACTIVE|CANCELED|ALL
  @Get('me/enrollments')
  myEnrollments(
    @CurrentUser() user: JwtUser,
    @Query('status') status?: 'ACTIVE' | 'CANCELED' | 'ALL',
  ) {
    // default ACTIVE nếu không truyền
    const normalized = (status ?? 'ACTIVE').toUpperCase() as 'ACTIVE' | 'CANCELED' | 'ALL'

    if (!['ACTIVE', 'CANCELED', 'ALL'].includes(normalized)) {
      // tránh 400 quá phức tạp, trả về mặc định ACTIVE
      return this.enrollments.myEnrollments(user.sub, CourseAccessStatus.ACTIVE)
    }

    if (normalized === 'ALL') return this.enrollments.myEnrollments(user.sub, 'ALL')
    return this.enrollments.myEnrollments(user.sub, normalized as CourseAccessStatus)
  }

 
  /**
   * Hủy enrollment (soft cancel)
   */
  @Post('courses/:id/cancel')
  cancel(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) courseId: number,
  ) {
    return this.enrollments.cancel(user.sub, courseId)
  }
}
