import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CoursesService } from "./courses.service";

type JwtUser = { sub: number; role: string }

@UseGuards(AccessTokenGuard)
@Controller("courses")
@UseGuards(AccessTokenGuard) // 🔒 mọi route phải đăng nhập
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}


   // ... các route khác của bạn

  // Outline lessons (ai login cũng xem được)
  // GET /courses/:id/lessons-outline
  @Get('courses/:id/lessons-outline')
  lessonsOutline(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.courses.lessonsOutline(user, id)
  }

  @Get()
  findAll() {
    return this.courses.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.courses.findOne(id);
  }

  @Get(":id/lessons")
  listLessons(@CurrentUser() user: any, @Param("id", ParseIntPipe) id: number) {
    return this.courses.listLessons(user, id);
  }

  // ✅ NEW: Lesson detail (theo lessonId)
  @Get(":id/lessons/:lessonId")
  getLesson(
    @CurrentUser() user: any,
    @Param("id", ParseIntPipe) courseId: number,
    @Param("lessonId", ParseIntPipe) lessonId: number
  ) {
    return this.courses.getLessonDetail(user, courseId, lessonId);
  }

  // ===== ADMIN ONLY =====
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.courses.remove(id);
  }
}
