import type { Field } from '@minisoccer/shared-types';

export type { Field } from '@minisoccer/shared-types';
export { FieldType, FieldStatus } from '@minisoccer/shared-types';

export interface FieldListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  search?: string;
  type?: Field['type'];
  status?: Field['status'];
}
