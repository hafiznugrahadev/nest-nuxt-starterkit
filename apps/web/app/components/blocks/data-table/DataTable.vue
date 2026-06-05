<script setup lang="ts" generic="TData">
import { FlexRender, getCoreRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table';
import { computed } from 'vue';

/**
 * SPEC DRY #1 (FE) — one headless table for every feature. Pass `columns` + `data`.
 * Loading/empty states are delegated to the shared block components.
 */
const props = defineProps<{
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
}>();

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
});

const isEmpty = computed(() => !props.isLoading && props.data.length === 0);
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-border">
    <table class="w-full caption-bottom text-sm">
      <thead class="bg-muted/50">
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="border-b border-border transition-colors"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="isLoading">
          <LoadingState as-row :colspan="columns.length" />
        </template>
        <template v-else-if="isEmpty">
          <EmptyState as-row :colspan="columns.length" />
        </template>
        <template v-else>
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
          >
            <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="p-4 align-middle">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
