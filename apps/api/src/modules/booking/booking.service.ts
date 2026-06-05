import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { UserRole } from '@minisoccer/shared-types';
import { BaseCrudService } from '@common/services/base-crud.service';
import { PaginatedResult } from '@common/interfaces/paginated-result.interface';
import type { AuthUser } from '@common/decorators/current-user.decorator';
import { minutesBetween } from '@common/utils/slug.util';
import { FieldService } from '@modules/field/field.service';
import { BookingEntity } from './entities/booking.entity';
import { BookingRepository } from './booking.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

/**
 * SPEC DRY #5 — extends BaseCrudService but adds real domain logic on create:
 * validates the time window, computes totalPrice from the field's hourly rate,
 * and rejects overlapping bookings. Demonstrates service→service access
 * (FieldService) allowed by the layering rules.
 */
@Injectable()
export class BookingService extends BaseCrudService<
  BookingEntity,
  CreateBookingDto,
  UpdateBookingDto,
  QueryBookingDto
> {
  protected readonly entityName = 'Booking';

  protected override get defaultInclude() {
    return { field: true };
  }

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly fieldService: FieldService,
  ) {
    super(bookingRepository);
  }

  override findAll(
    query: QueryBookingDto,
    currentUser?: AuthUser,
  ): Promise<PaginatedResult<BookingEntity>> {
    const where: Record<string, unknown> = {};
    if (query.fieldId) where.fieldId = query.fieldId;
    if (query.status) where.status = query.status;
    // Non-admins only ever see their own bookings, regardless of query params.
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      where.customerId = currentUser.id;
    }
    return this.bookingRepository.paginate(query, { where, include: { field: true } });
  }

  async createForCustomer(dto: CreateBookingDto, customerId: string): Promise<BookingEntity> {
    const durationMinutes = minutesBetween(dto.startTime, dto.endTime);
    if (durationMinutes <= 0) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const field = await this.fieldService.findOne(dto.fieldId); // 404 if missing
    if (field.status !== 'AVAILABLE') {
      throw new BadRequestException('Field is not available for booking');
    }

    const date = new Date(dto.date);
    const overlapping = await this.bookingRepository.findOverlapping(
      dto.fieldId,
      date,
      dto.startTime,
      dto.endTime,
    );
    if (overlapping.length > 0) {
      throw new ConflictException('Selected time slot is already booked');
    }

    const totalPrice = Math.round((field.pricePerHour * durationMinutes) / 60);

    return this.bookingRepository.create(
      {
        fieldId: dto.fieldId,
        customerId,
        date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        notes: dto.notes,
        totalPrice,
        status: 'PENDING',
      },
      { field: true },
    );
  }
}
