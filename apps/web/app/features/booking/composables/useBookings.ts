import { type MaybeRefOrGetter, toValue } from 'vue';
import { usePaginatedQuery } from '~/composables/usePaginatedQuery';
import { useApiMutation } from '~/composables/useApiMutation';
import { useBookingApi } from '../api/booking.api';
import type { BookingListParams } from '../types';

/** Paginated bookings query — composes the generic usePaginatedQuery wrapper. */
export function useBookings(params: MaybeRefOrGetter<BookingListParams>) {
  const bookingApi = useBookingApi();
  return usePaginatedQuery(
    'bookings',
    (p: BookingListParams) => bookingApi.list(p),
    () => toValue(params),
  );
}

/** Create-booking mutation — invalidates the list and toasts on success. */
export function useCreateBooking() {
  const bookingApi = useBookingApi();
  return useApiMutation(bookingApi.create, {
    invalidateKeys: ['bookings'],
    successMessage: 'Booking created',
  });
}
