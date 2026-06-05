import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import type { Field } from '@minisoccer/shared-types';
import Badge from '~/components/ui/Badge.vue';
import { formatIDR } from '~/lib/utils';

const statusVariant: Record<Field['status'], string> = {
  AVAILABLE: 'default',
  MAINTENANCE: 'secondary',
  INACTIVE: 'muted',
};

/** Column config consumed by the generic <DataTable />. */
export const fieldColumns: ColumnDef<Field, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => h(Badge, { variant: 'outline' }, () => row.original.type),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant[row.original.status] as never }, () => row.original.status),
  },
  {
    accessorKey: 'pricePerHour',
    header: 'Price / hour',
    cell: ({ row }) => formatIDR(row.original.pricePerHour),
  },
];
