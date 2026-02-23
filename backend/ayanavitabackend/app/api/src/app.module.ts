import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { CoursesModule } from './courses/courses.module'
import { LessonsModule } from './lessons/lessons.module'
import { EnrollmentsModule } from './enrollments/enrollments.module'
import { OrdersModule } from './orders/orders.module'
import { ProgressModule } from './progress/progress.module'
import { CmsModule } from './cms/cms.module'




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
    

  ],
})
export class AppModule {}
