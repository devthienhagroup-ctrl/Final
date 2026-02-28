import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { CoursesModule } from './courses/courses.module';
import { CourseTopicsModule } from './course-topics/course-topics.module';
import { LessonsModule } from './lessons/lessons.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';

import { OrdersModule } from './orders/orders.module';
import { BookingModule } from './booking/booking.module';

import { CmsModule } from './cms/cms.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [
    PrismaModule,

    UsersModule,
    AuthModule,

    CoursesModule,
    CourseTopicsModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,

    OrdersModule,
    BookingModule,

    CmsModule,
    CatalogModule,
  ],
})
export class AppModule {}