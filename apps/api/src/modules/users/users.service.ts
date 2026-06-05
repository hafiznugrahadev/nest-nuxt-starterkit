import { Injectable, Logger } from '@nestjs/common';
import { BaseCrudService } from '@common/services/base-crud.service';
import { PaginatedResult } from '@common/interfaces/paginated-result.interface';
import { RedisService } from '@infrastructure/redis/redis.service';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { QueryUserDto } from './dto/query-user.dto';

/**
 * Read-only user listing (admin). Demonstrates two reusable patterns:
 *  - `omit` so the password hash never leaves the repository, and
 *  - a Redis-cached list invalidated by a generation counter, degrading
 *    gracefully when Redis is unavailable.
 */
@Injectable()
export class UsersService extends BaseCrudService<UserEntity, never, never, QueryUserDto> {
  protected readonly entityName = 'User';

  private readonly logger = new Logger(UsersService.name);
  private readonly cacheTtlSeconds = 30;
  private readonly genKey = 'users:gen';

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly redis: RedisService,
  ) {
    super(usersRepository);
  }

  override async findAll(query: QueryUserDto): Promise<PaginatedResult<UserEntity>> {
    const cacheKey = await this.listCacheKey(query);

    const cached = await this.safe(() => this.redis.get<PaginatedResult<UserEntity>>(cacheKey));
    if (cached) return cached;

    const where: Record<string, unknown> = {};
    if (query.role) where.role = query.role;
    const result = await this.usersRepository.paginate(query, {
      where,
      omit: { password: true },
    });

    await this.safe(() => this.redis.set(cacheKey, result, this.cacheTtlSeconds));
    return result;
  }

  private async listCacheKey(query: QueryUserDto): Promise<string> {
    const gen = (await this.safe(() => this.redis.get<number>(this.genKey))) ?? 0;
    return `users:list:${gen}:${JSON.stringify(query)}`;
  }

  /** Run a cache operation, swallowing errors so Redis is never a hard dependency. */
  private async safe<R>(fn: () => Promise<R>): Promise<R | null> {
    try {
      return await fn();
    } catch (err) {
      this.logger.warn(`Redis cache unavailable: ${(err as Error).message}`);
      return null;
    }
  }
}
