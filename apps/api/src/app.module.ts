import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from '@config/env.validation';
import { appConfig } from '@config/app.config';
import { databaseConfig, redisConfig } from '@config/database.config';
import { RequestIdMiddleware } from '@common/middleware/request-id.middleware';
import { IsUniqueConstraint } from '@common/validators/is-unique.validator';
import { PrismaModule } from '@infrastructure/database/prisma.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FieldModule } from '@modules/field/field.module';
import { BookingModule } from '@modules/booking/booking.module';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig, redisConfig],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        customProps: (req) => ({ requestId: req.headers['x-request-id'] }),
      },
    }),
    // Global rate limiting; per-route overrides via @Throttle (e.g. login).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    FieldModule,
    BookingModule,
    HealthModule,
  ],
  // Provided here too so class-validator's container can resolve the async validator.
  providers: [
    IsUniqueConstraint,
    // Apply rate limiting across every route by default.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
