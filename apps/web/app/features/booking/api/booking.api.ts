import type { ApiResponse, Booking, Paginated } from '@minisoccer/shared-types';
import { unwrap, unwrapPaginated } from '~/lib/api-client';
import { useApi } from '~/composables/useApi';
import type { BookingListParams } from '../types';
import type { BookingFormValues } from '../schemas/booking.schema';

/** Feature fetchers — all go through the shared apiClient (SPEC DRY #4 FE). */
export function useBookingApi() {
  const api = useApi();

  return {
    list(params: BookingListParams): Promise<Paginated<Booking>> {
      return api<ApiResponse<Booking[]>>('/bookings', { query: params }).then(unwrapPaginated);
    },
    create(body: BookingFormValues): Promise<Booking> {
      return api<ApiResponse<Booking>>('/bookings', { method: 'POST', body }).then(unwrap);
    },
  };
}
