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
import { CartModule } from './cart/cart.module';
import { ProductOrdersModule } from './product-orders/product-orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BlogModule } from './blog/blog.module';
import { RbacModule } from './rbac/rbac.module';

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
    CartModule,
    ProductOrdersModule,
    ReviewsModule,
    BlogModule,
    RbacModule,
  ],
})
export class AppModule {}