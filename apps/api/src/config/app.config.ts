import { registerAs } from '@nestjs/config';

/** Strongly-typed app config namespace — inject via `ConfigService.get('app')`. */
export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  // Single root .env uses API_PORT; containers/compose set PORT, which wins.
  port: parseInt(process.env.PORT ?? process.env.API_PORT ?? '4400', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  jwt: {
    // Required & validated at startup (see env.validation.ts) — no insecure fallback.
    secret: process.env.JWT_SECRET as string,
    // Short-lived access token; long-lived opaque refresh token (see auth.service.ts).
    accessExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiresInDays: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS ?? '7', 10),
  },
  cookie: {
    // Cross-site in prod (web + api on different hosts) requires SameSite=None+Secure.
    secure: (process.env.NODE_ENV ?? 'development') === 'production',
  },
}));

export type AppConfig = ReturnType<typeof appConfig>;
