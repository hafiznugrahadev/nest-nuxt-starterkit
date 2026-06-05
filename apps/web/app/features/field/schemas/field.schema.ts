import { z } from 'zod';
import { FieldStatus, FieldType } from '@minisoccer/shared-types';

/** FE-only Zod schema (BE uses class-validator). Mirrors CreateFieldDto. */
export const fieldFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  type: z.enum([FieldType.INDOOR, FieldType.OUTDOOR, FieldType.SYNTHETIC]),
  status: z
    .enum([FieldStatus.AVAILABLE, FieldStatus.MAINTENANCE, FieldStatus.INACTIVE])
    .default(FieldStatus.AVAILABLE),
  pricePerHour: z.coerce.number().int().min(0, 'Price must be >= 0'),
  description: z.string().optional(),
});

export type FieldFormValues = z.infer<typeof fieldFormSchema>;
