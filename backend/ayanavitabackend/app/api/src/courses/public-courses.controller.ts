import { Controller, Get, Param, Query } from '@nestjs/common'
import { PublicCoursesService } from './public-courses.service'

@Controller('public/courses')
export class PublicCoursesController {
  constructor(private readonly service: PublicCoursesService) {}

  @Get('slug/:slug')
  detailBySlug(@Param('slug') slug: string, @Query('lang') lang = 'vi') {
    return this.service.detailBySlug(slug, lang)
  }
}
