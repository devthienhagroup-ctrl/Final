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
  UseGuards,
} from "@nestjs/common";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { OptionalAccessTokenGuard } from "../auth/guards/optional-access-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CoursesService } from "./courses.service";
import { CourseQueryDto } from "./dto/course-query.dto";

type JwtUser = { sub: number; role: string }

@Controller("courses")
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}


   // ... các route khác của bạn

  // Outline lessons (ai login cũng xem được)
  // GET /courses/:id/lessons-outline
  @UseGuards(AccessTokenGuard)
  @Get('courses/:id/lessons-outline')
  lessonsOutline(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.courses.lessonsOutline(user, id)
  }

  @Get()
  @UseGuards(OptionalAccessTokenGuard)
  findAll(@CurrentUser() user: JwtUser | null, @Query() query: CourseQueryDto) {
    return this.courses.findAll(query, user);
  }

  @UseGuards(AccessTokenGuard)
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.courses.findOne(id);
  }

  @UseGuards(AccessTokenGuard)
  @Get(":id/lessons")
  listLessons(@CurrentUser() user: any, @Param("id", ParseIntPipe) id: number) {
    return this.courses.listLessons(user, id);
  }

  // ✅ NEW: Lesson detail (theo lessonId)
  @UseGuards(AccessTokenGuard)
  @Get(":id/lessons/:lessonId")
  getLesson(
    @CurrentUser() user: any,
    @Param("id", ParseIntPipe) courseId: number,
    @Param("lessonId", ParseIntPipe) lessonId: number
  ) {
    return this.courses.getLessonDetail(user, courseId, lessonId);
  }

  // ===== ADMIN ONLY =====
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("ADMIN")
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, dto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.courses.remove(id);
  }
}
