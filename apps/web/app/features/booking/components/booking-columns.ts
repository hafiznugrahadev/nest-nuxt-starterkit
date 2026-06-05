import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import type { Booking } from '@minisoccer/shared-types';
import Badge from '~/components/ui/Badge.vue';
import { formatIDR } from '~/lib/utils';

const statusVariant: Record<Booking['status'], string> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  CANCELLED: 'outline',
  COMPLETED: 'outline',
};

/** Column config consumed by the generic <DataTable />. */
export const bookingColumns: ColumnDef<Booking, unknown>[] = [
  {
    accessorKey: 'field',
    header: 'Field',
    cell: ({ row }) => row.original.field?.name ?? row.original.fieldId,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString('id-ID'),
  },
  {
    id: 'time',
    header: 'Time',
    cell: ({ row }) => `${row.original.startTime}–${row.original.endTime}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant[row.original.status] as never }, () => row.original.status),
  },
  {
    accessorKey: 'totalPrice',
    header: 'Total',
    cell: ({ row }) => formatIDR(row.original.totalPrice),
  },
];
