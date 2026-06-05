import { Injectable } from '@nestjs/common';
import { BaseRepository, PrismaDelegate } from '@common/repositories/base.repository';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { BookingEntity } from './entities/booking.entity';

@Injectable()
export class BookingRepository extends BaseRepository<BookingEntity> {
  protected readonly searchableFields = ['notes'];

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.booking as unknown as PrismaDelegate;
  }

  /** Overlapping bookings for the same field/date that block a new slot. */
  findOverlapping(fieldId: string, date: Date, startTime: string, endTime: string) {
    return this.prisma.booking.findMany({
      where: {
        fieldId,
        date,
        status: { in: ['PENDING', 'CONFIRMED'] },
        // string HH:mm compares lexicographically, which is correct for same-day slots
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });
  }
}
