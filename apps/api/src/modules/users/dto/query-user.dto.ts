import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@starterkit/shared-types';
import { BaseQueryDto } from '@common/dto/base-query.dto';

/** SPEC DRY #2 — extend BaseQueryDto, add only user-specific filters. */
export class QueryUserDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
