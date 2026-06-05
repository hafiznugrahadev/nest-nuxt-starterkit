import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import type { User } from '@starterkit/shared-types';
import Badge from '~/components/ui/Badge.vue';

const roleVariant: Record<string, string> = {
  ADMIN: 'default',
  USER: 'secondary',
};

/** Column config consumed by the generic <DataTable />. */
export const userColumns: ColumnDef<User, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        row.original.roles.map((role) =>
          h(Badge, { key: role, variant: (roleVariant[role] ?? 'outline') as never }, () => role),
        ),
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('id-ID'),
  },
];
