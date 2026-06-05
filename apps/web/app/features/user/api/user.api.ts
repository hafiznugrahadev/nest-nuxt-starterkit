import type { ApiResponse, Paginated, User } from '@starterkit/shared-types';
import { unwrapPaginated } from '~/lib/api-client';
import { useApi } from '~/composables/useApi';
import type { UserListParams } from '../types';

/** Feature fetchers — all go through the shared apiClient (SPEC DRY #4 FE). */
export function useUserApi() {
  const api = useApi();

  return {
    list(params: UserListParams): Promise<Paginated<User>> {
      return api<ApiResponse<User[]>>('/users', { query: params }).then(unwrapPaginated);
    },
  };
}
