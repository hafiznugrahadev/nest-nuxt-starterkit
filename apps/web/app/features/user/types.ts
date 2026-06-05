export type { User } from '@starterkit/shared-types';
export { UserRole } from '@starterkit/shared-types';

export interface UserListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  search?: string;
  /** Filter by role name (e.g. 'ADMIN'). */
  role?: string;
}
