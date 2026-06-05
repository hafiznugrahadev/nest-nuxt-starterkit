import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { UsersModule } from '@modules/users/users.module';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Single source of truth: the monorepo-root .env (cwd is apps/api at runtime).
      // Real env vars (e.g. from docker-compose) still take precedence.
      envFilePath: ['../../.env'],
      validate: validateEnv,
      load: [appConfig, databaseConfig, redisConfig],
    }),
    // Logger config flows from ConfigService (.env → app.config → here).
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('app.logLevel') ?? 'info',
          transport:
            config.get<string>('app.env') === 'production'
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          customProps: (req) => ({ requestId: req.headers['x-request-id'] }),
        },
      }),
    }),
    // Global rate limiting (config-driven); per-route overrides via @Throttle.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('app.throttle.ttl') ?? 60_000,
          limit: config.get<number>('app.throttle.limit') ?? 100,
        },
      ],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
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
