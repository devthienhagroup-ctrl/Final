import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as express from 'express'
import { join } from 'path'

import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    rawBody: true,
  })

  const allow = new Set<string>([
    'http://ayanavita-germany.com',
    'https://ayanavita-germany.com',
    'http://admin.ayanavita.com',
    'https://admin.ayanavita.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5176',
    'http://localhost:5178',
    'http://127.0.0.1:5178',
    'http://localhost:5179',
    'http://127.0.0.1:5179',
    'http://localhost:5180',
    'http://127.0.0.1:5180',
    'http://localhost:5181',
    'http://127.0.0.1:5181',
    'http://localhost:5050',
    'http://127.0.0.1:5050',
  ])

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allow.has(origin)) return callback(null, true)

      console.error(`CORS blocked for origin: ${origin}`)
      return callback(new Error(`CORS blocked for origin: ${origin}`), false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  app.use('/booking-temp-images', express.static(join(process.cwd(), 'temp-images')))

  app.useGlobalFilters(new AllExceptionsFilter())
  app.enableShutdownHooks()

  const config = new DocumentBuilder()
    .setTitle('AYANAVITA API')
    .setDescription('LMS Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = Number(process.env.PORT || 3000)
  await app.listen(port)

  console.log(`AYANAVITA API listening on http://localhost:${port}`)
  console.log(`Swagger: http://localhost:${port}/docs`)
}

bootstrap()
