export type { User } from '@starterkit/shared-types';
export { UserRole } from '@starterkit/shared-types';

export interface UserListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  search?: string;
  /** Filter by one or more role names (server-side; users holding ANY of them). */
  roles?: string[];
}
