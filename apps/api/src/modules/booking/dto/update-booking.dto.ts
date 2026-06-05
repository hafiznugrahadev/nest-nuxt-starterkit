import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '@minisoccer/shared-types';
import { CreateBookingDto } from './create-booking.dto';

/**
 * SPEC DRY #3 — derive from CreateBookingDto. `fieldId` is immutable after
 * creation (re-book instead), so it is omitted; `status` is added for admin
 * confirmation/cancellation flows.
 */
export class UpdateBookingDto extends PartialType(
  OmitType(CreateBookingDto, ['fieldId'] as const),
) {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
