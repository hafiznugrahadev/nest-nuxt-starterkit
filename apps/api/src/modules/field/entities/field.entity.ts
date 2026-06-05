import { ApiProperty } from '@nestjs/swagger';
import { FieldStatus, FieldType } from '@minisoccer/shared-types';
import { BaseEntity } from '@common/entities/base.entity';

/** Response shape for a field. Extends BaseEntity (SPEC DRY #1). */
export class FieldEntity extends BaseEntity {
  @ApiProperty() name!: string;
  @ApiProperty({ enum: FieldType }) type!: FieldType;
  @ApiProperty({ enum: FieldStatus }) status!: FieldStatus;
  @ApiProperty({ description: 'Price per hour in IDR (whole rupiah)' }) pricePerHour!: number;
  @ApiProperty({ required: false, nullable: true }) description?: string | null;
}
