import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { CourseTopicsService } from './course-topics.service'
import { CreateCourseTopicDto } from './dto/create-course-topic.dto'
import { UpdateCourseTopicDto } from './dto/update-course-topic.dto'

@UseGuards(AccessTokenGuard, PermissionGuard)
@Permissions('courses.manage')
@Controller('admin/course-topics')
export class CourseTopicsController {
  constructor(private readonly service: CourseTopicsService) {}

  @Get()
  list() {
    return this.service.list()
  }

  @Post()
  create(@Body() dto: CreateCourseTopicDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseTopicDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
