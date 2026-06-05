import { Module } from '@nestjs/common';
import { FieldModule } from '@modules/field/field.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';

@Module({
  imports: [FieldModule], // for FieldService (price + availability)
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService],
})
export class BookingModule {}
