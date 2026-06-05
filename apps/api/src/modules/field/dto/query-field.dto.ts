import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FieldStatus, FieldType } from '@minisoccer/shared-types';
import { BaseQueryDto } from '@common/dto/base-query.dto';

/** SPEC DRY #2 — extend BaseQueryDto, add only field-specific filters. */
export class QueryFieldDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: FieldType })
  @IsOptional()
  @IsEnum(FieldType)
  type?: FieldType;

  @ApiPropertyOptional({ enum: FieldStatus })
  @IsOptional()
  @IsEnum(FieldStatus)
  status?: FieldStatus;
}
