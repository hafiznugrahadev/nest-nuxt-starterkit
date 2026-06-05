import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@minisoccer/shared-types';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '@common/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated.decorator';
import { BookingEntity } from './entities/booking.entity';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings (admins see all; customers see their own)' })
  @ApiPaginatedResponse(BookingEntity)
  findAll(@Query() query: QueryBookingDto, @CurrentUser() user: AuthUser) {
    return this.bookingService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking for the current customer' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser) {
    return this.bookingService.createForCustomer(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update / change booking status (admin)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a booking (admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.remove(id);
  }
}
