import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

/** Coerce common env truthy strings ("true"/"1") into a real boolean. */
const toBool = ({ value }: { value: unknown }): boolean =>
  value === true || value === 'true' || value === '1';

/**
 * Env schema validated at startup with class-validator (SPEC: validate env with
 * class-validator, not Zod). Wire into ConfigModule via `validate: validateEnv`.
 */
export enum NodeEnv {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  PORT = 4400;

  @IsString()
  @IsOptional()
  API_PREFIX = 'api';

  @IsString()
  @IsOptional()
  CORS_ORIGIN = '*';

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  REDIS_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  REDIS_PORT = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD = '';

  @IsString()
  @MinLength(16, { message: 'JWT_SECRET must be at least 16 characters' })
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN = '15m';

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  JWT_REFRESH_EXPIRES_DAYS = 7;

  @IsString()
  @IsOptional()
  LOG_LEVEL = 'info';

  // ── Swagger docs (protected with Basic Auth) ──────────────────────────────
  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED = true;

  @IsString()
  @IsOptional()
  SWAGGER_USER = 'admin';

  @IsString()
  @IsOptional()
  SWAGGER_PASSWORD = 'admin';

  // ── Rate limiting (global ThrottlerModule) ────────────────────────────────
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  THROTTLE_TTL_MS = 60000;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  THROTTLE_LIMIT = 100;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  return validated;
}
