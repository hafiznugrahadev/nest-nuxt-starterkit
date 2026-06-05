import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { FieldStatus, FieldType } from '@minisoccer/shared-types';

export class CreateFieldDto {
  @ApiProperty({ example: 'Lapangan A (Indoor)' })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({ enum: FieldType, default: FieldType.INDOOR })
  @IsEnum(FieldType)
  type!: FieldType;

  @ApiPropertyOptional({ enum: FieldStatus, default: FieldStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(FieldStatus)
  status?: FieldStatus;

  @ApiProperty({ example: 150000, description: 'IDR per hour' })
  @IsInt()
  @Min(0)
  pricePerHour!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
