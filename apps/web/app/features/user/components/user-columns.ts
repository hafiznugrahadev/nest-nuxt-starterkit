import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import type { User } from '@starterkit/shared-types';
import Badge from '~/components/ui/Badge.vue';

const roleVariant: Record<User['role'], string> = {
  ADMIN: 'default',
  USER: 'secondary',
};

/** Column config consumed by the generic <DataTable />. */
export const userColumns: ColumnDef<User, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) =>
      h(Badge, { variant: roleVariant[row.original.role] as never }, () => row.original.role),
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('id-ID'),
  },
];
