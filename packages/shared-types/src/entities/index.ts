import type { UserRole } from '../enums/user-role.enum';
import type { FieldStatus, FieldType } from '../enums/field-type.enum';
import type { BookingStatus } from '../enums/booking-status.enum';

/** Fields every persisted entity carries — mirrors BE `BaseEntity` (SPEC DRY #1). */
export interface BaseModel {
  id: string;
  createdAt: string; // ISO-8601 over the wire
  updatedAt: string;
}

export interface User extends BaseModel {
  email: string;
  name: string;
  role: UserRole;
}

export interface Field extends BaseModel {
  name: string;
  type: FieldType;
  status: FieldStatus;
  pricePerHour: number;
  description?: string | null;
}

export interface Booking extends BaseModel {
  fieldId: string;
  customerId: string;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  totalPrice: number;
  notes?: string | null;
  field?: Field;
  customer?: User;
}
