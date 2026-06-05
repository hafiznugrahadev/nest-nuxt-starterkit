import type { UserRole } from '../enums/user-role.enum';

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
