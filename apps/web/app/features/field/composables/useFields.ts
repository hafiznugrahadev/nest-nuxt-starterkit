import { type MaybeRefOrGetter, toValue } from 'vue';
import { usePaginatedQuery } from '~/composables/usePaginatedQuery';
import { useFieldApi } from '../api/field.api';
import type { FieldListParams } from '../types';

/** Paginated fields query — composes the generic usePaginatedQuery wrapper. */
export function useFields(params: MaybeRefOrGetter<FieldListParams>) {
  const fieldApi = useFieldApi();
  return usePaginatedQuery(
    'fields',
    (p: FieldListParams) => fieldApi.list(p),
    () => toValue(params),
  );
}
