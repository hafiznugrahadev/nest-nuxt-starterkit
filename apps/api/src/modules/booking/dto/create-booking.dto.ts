import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fieldId!: string;

  @ApiProperty({ example: '2026-06-10', description: 'Booking date (YYYY-MM-DD)' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '19:00' })
  @Matches(HHMM, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '21:00' })
  @Matches(HHMM, { message: 'endTime must be HH:mm' })
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
