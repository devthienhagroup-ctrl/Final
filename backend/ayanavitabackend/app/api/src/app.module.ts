import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { BookingModule } from './booking/booking.module'
import { CoursesModule } from './courses/courses.module'
import { EnrollmentsModule } from './enrollments/enrollments.module'
import { LessonsModule } from './lessons/lessons.module'
import { OrdersModule } from './orders/orders.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProgressModule } from './progress/progress.module'
import { CmsModule } from './cms/cms.module'



import { UsersModule } from './users/users.module'

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    OrdersModule,
    CmsModule,


    BookingModule,
  ],
})
export class AppModule {}