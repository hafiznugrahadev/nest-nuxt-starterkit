import type { ApiResponse, Field, Paginated } from '@minisoccer/shared-types';
import { unwrap, unwrapPaginated } from '~/lib/api-client';
import { useApi } from '~/composables/useApi';
import type { FieldListParams } from '../types';
import type { FieldFormValues } from '../schemas/field.schema';

/** Feature fetchers — all go through the shared apiClient (SPEC DRY #4 FE). */
export function useFieldApi() {
  const api = useApi();

  return {
    list(params: FieldListParams): Promise<Paginated<Field>> {
      return api<ApiResponse<Field[]>>('/fields', { query: params }).then(unwrapPaginated);
    },
    get(id: string): Promise<Field> {
      return api<ApiResponse<Field>>(`/fields/${id}`).then(unwrap);
    },
    create(body: FieldFormValues): Promise<Field> {
      return api<ApiResponse<Field>>('/fields', { method: 'POST', body }).then(unwrap);
    },
    update(id: string, body: Partial<FieldFormValues>): Promise<Field> {
      return api<ApiResponse<Field>>(`/fields/${id}`, { method: 'PATCH', body }).then(unwrap);
    },
    remove(id: string): Promise<Field> {
      return api<ApiResponse<Field>>(`/fields/${id}`, { method: 'DELETE' }).then(unwrap);
    },
  };
}
