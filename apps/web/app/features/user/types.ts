import type { User } from '@starterkit/shared-types';

export type { User } from '@starterkit/shared-types';
export { UserRole } from '@starterkit/shared-types';

export interface UserListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  search?: string;
  role?: User['role'];
}
