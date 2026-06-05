import { z } from 'zod';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** FE-only Zod schema (BE uses class-validator). Mirrors CreateBookingDto. */
export const bookingFormSchema = z
  .object({
    fieldId: z.string().uuid('Select a field'),
    date: z.string().min(1, 'Pick a date'),
    startTime: z.string().regex(HHMM, 'Use HH:mm'),
    endTime: z.string().regex(HHMM, 'Use HH:mm'),
    notes: z.string().optional(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
