import { Injectable, Logger } from '@nestjs/common';
import { BaseCrudService } from '@common/services/base-crud.service';
import { PaginatedResult } from '@common/interfaces/paginated-result.interface';
import { RedisService } from '@infrastructure/redis/redis.service';
import { FieldEntity } from './entities/field.entity';
import { FieldRepository } from './field.repository';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { QueryFieldDto } from './dto/query-field.dto';

/**
 * SPEC DRY #5 — inherits CRUD from BaseCrudService; overrides findAll only to
 * apply field-specific filters (type/status) on top of the base pagination.
 *
 * The field catalog is read-heavy and rarely changes, so list results are cached
 * in Redis. A monotonically-increasing generation counter is baked into the cache
 * key; any mutation bumps it, instantly invalidating every cached variation
 * without SCAN. Cache access degrades gracefully if Redis is unavailable.
 */
@Injectable()
export class FieldService extends BaseCrudService<
  FieldEntity,
  CreateFieldDto,
  UpdateFieldDto,
  QueryFieldDto
> {
  protected readonly entityName = 'Field';

  private readonly logger = new Logger(FieldService.name);
  private readonly cacheTtlSeconds = 30;
  private readonly genKey = 'fields:gen';

  constructor(
    private readonly fieldRepository: FieldRepository,
    private readonly redis: RedisService,
  ) {
    super(fieldRepository);
  }

  override async findAll(query: QueryFieldDto): Promise<PaginatedResult<FieldEntity>> {
    const cacheKey = await this.listCacheKey(query);

    const cached = await this.safe(() => this.redis.get<PaginatedResult<FieldEntity>>(cacheKey));
    if (cached) return cached;

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    const result = await this.fieldRepository.paginate(query, { where });

    await this.safe(() => this.redis.set(cacheKey, result, this.cacheTtlSeconds));
    return result;
  }

  override async create(dto: CreateFieldDto): Promise<FieldEntity> {
    const created = await super.create(dto);
    await this.invalidateList();
    return created;
  }

  override async update(id: string, dto: UpdateFieldDto): Promise<FieldEntity> {
    const updated = await super.update(id, dto);
    await this.invalidateList();
    return updated;
  }

  override async remove(id: string): Promise<FieldEntity> {
    const removed = await super.remove(id);
    await this.invalidateList();
    return removed;
  }

  private async listCacheKey(query: QueryFieldDto): Promise<string> {
    const gen = (await this.safe(() => this.redis.get<number>(this.genKey))) ?? 0;
    return `fields:list:${gen}:${JSON.stringify(query)}`;
  }

  private async invalidateList(): Promise<void> {
    await this.safe(() => this.redis.raw.incr(this.genKey));
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
