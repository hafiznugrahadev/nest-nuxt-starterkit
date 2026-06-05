// Public API barrel for the `booking` feature (SPEC: features/ imported explicitly).
export { default as BookingTable } from './components/BookingTable.vue';
export { default as BookingForm } from './components/BookingForm.vue';
export { bookingColumns } from './components/booking-columns';
export { useBookings, useCreateBooking } from './composables/useBookings';
export { useBookingApi } from './api/booking.api';
export { bookingFormSchema, type BookingFormValues } from './schemas/booking.schema';
export type { BookingListParams } from './types';
