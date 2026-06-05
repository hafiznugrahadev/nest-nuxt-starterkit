import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Read runtime settings from validated config (loaded from .env by ConfigModule).
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api';
  const corsOrigin = config.get<string>('app.corsOrigin') ?? '*';
  const isProd = config.get<string>('app.env') === 'production';
  const port = config.get<number>('app.port') ?? 4400;

  app.setGlobalPrefix(apiPrefix);

  // Parse cookies so the auth controller can read the httpOnly refresh token.
  app.use(cookieParser());

  // Credentialed CORS (cookies) cannot use a literal "*" origin — browsers reject
  // it. With "*" we reflect the request origin (dev convenience) and warn loudly;
  // in production an explicit allow-list is required for the refresh cookie to work.
  const origin = corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim());
  if (corsOrigin === '*') {
    const msg =
      'CORS_ORIGIN is "*": reflecting all origins. Set explicit origins — required for secure cookies.';
    if (isProd) logger.error(msg);
    else logger.warn(msg);
  }
  app.enableCors({ origin, credentials: true });

  // SPEC DRY #7 — one global ValidationPipe governs every DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // SPEC DRY #6 — uniform response envelope + uniform error envelope, set once.
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Let class-validator resolve DI-backed validators (e.g. IsUnique).
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mini Soccer API')
    .setDescription('Field booking platform API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);

  logger.log(`API running on http://localhost:${port}/${apiPrefix} (docs: /${apiPrefix}/docs)`);
}

void bootstrap();
