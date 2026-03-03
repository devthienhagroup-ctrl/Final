import { Module } from '@nestjs/common'
import { InstructorController } from './instructor.controller'
import { CoursesModule } from '../courses/courses.module'
import { LessonsModule } from '../lessons/lessons.module'
import { PrismaModule } from '../prisma/prisma.module'
import { CourseTopicsModule } from '../course-topics/course-topics.module'

@Module({
  imports: [CoursesModule, LessonsModule, PrismaModule, CourseTopicsModule],
  controllers: [InstructorController],
})
export class InstructorModule {}
