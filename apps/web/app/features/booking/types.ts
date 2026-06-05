import type { Booking } from '@minisoccer/shared-types';

export type { Booking } from '@minisoccer/shared-types';
export { BookingStatus } from '@minisoccer/shared-types';

export interface BookingListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  search?: string;
  status?: Booking['status'];
}
