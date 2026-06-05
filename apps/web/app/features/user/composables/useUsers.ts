import { type MaybeRefOrGetter, toValue } from 'vue';
import { usePaginatedQuery } from '~/composables/usePaginatedQuery';
import { useUserApi } from '../api/user.api';
import type { UserListParams } from '../types';

/** Paginated users query — composes the generic usePaginatedQuery wrapper. */
export function useUsers(params: MaybeRefOrGetter<UserListParams>) {
  const userApi = useUserApi();
  return usePaginatedQuery(
    'users',
    (p: UserListParams) => userApi.list(p),
    () => toValue(params),
  );
}
