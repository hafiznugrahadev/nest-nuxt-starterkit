import { BadRequestException, ConflictException } from '@nestjs/common';
import { FieldStatus } from '@minisoccer/shared-types';
import { BookingService } from '../booking.service';
import { BookingRepository } from '../booking.repository';
import { FieldService } from '@modules/field/field.service';

describe('BookingService.createForCustomer', () => {
  const baseField = {
    id: 'field-1',
    name: 'Lapangan A',
    type: 'INDOOR' as const,
    status: FieldStatus.AVAILABLE as FieldStatus,
    pricePerHour: 150000,
  };

  function makeService(overrides?: { field?: Partial<typeof baseField>; overlapping?: unknown[] }) {
    const repo = {
      findOverlapping: jest.fn().mockResolvedValue(overrides?.overlapping ?? []),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'b1', ...data })),
    } as unknown as BookingRepository;

    const fieldService = {
      findOne: jest.fn().mockResolvedValue({ ...baseField, ...overrides?.field }),
    } as unknown as FieldService;

    return { service: new BookingService(repo, fieldService), repo, fieldService };
  }

  const dto = {
    fieldId: 'field-1',
    date: '2026-06-10',
    startTime: '19:00',
    endTime: '21:00',
  };

  it('computes totalPrice from hourly rate × duration', async () => {
    const { service, repo } = makeService();
    const result = await service.createForCustomer(dto, 'cust-1');
    // 2 hours × 150000
    expect(result.totalPrice).toBe(300000);
    expect(repo.create).toHaveBeenCalled();
  });

  it('rejects when endTime is not after startTime', async () => {
    const { service } = makeService();
    await expect(
      service.createForCustomer({ ...dto, endTime: '19:00' }, 'cust-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when field is not AVAILABLE', async () => {
    const { service } = makeService({ field: { status: FieldStatus.MAINTENANCE } });
    await expect(service.createForCustomer(dto, 'cust-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects overlapping slots', async () => {
    const { service } = makeService({ overlapping: [{ id: 'existing' }] });
    await expect(service.createForCustomer(dto, 'cust-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
