import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@minisoccer/shared-types';
import { BaseEntity } from '@common/entities/base.entity';
import { FieldEntity } from '@modules/field/entities/field.entity';

export class BookingEntity extends BaseEntity {
  @ApiProperty() fieldId!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty({ type: String, format: 'date' }) date!: Date;
  @ApiProperty({ example: '19:00' }) startTime!: string;
  @ApiProperty({ example: '21:00' }) endTime!: string;
  @ApiProperty({ enum: BookingStatus }) status!: BookingStatus;
  @ApiProperty() totalPrice!: number;
  @ApiProperty({ required: false, nullable: true }) notes?: string | null;
  @ApiProperty({ type: () => FieldEntity, required: false }) field?: FieldEntity;
}
