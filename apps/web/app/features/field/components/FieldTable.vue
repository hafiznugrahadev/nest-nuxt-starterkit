<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFields } from '../composables/useFields';
import { fieldColumns } from './field-columns';
import type { FieldListParams } from '../types';

const search = ref('');
const page = ref(1);

const params = computed<FieldListParams>(() => ({
  page: page.value,
  limit: 10,
  search: search.value || undefined,
}));

const { data, isLoading, isError, error, refetch } = useFields(params);
const rows = computed(() => data.value?.data ?? []);
const meta = computed(() => data.value?.meta);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <Input v-model="search" placeholder="Search fields…" class="max-w-xs" />
      <span v-if="meta" class="text-sm text-muted-foreground">
        {{ meta.total }} field{{ meta.total === 1 ? '' : 's' }}
      </span>
    </div>

    <ErrorState v-if="isError" :message="(error as Error)?.message" @retry="refetch()" />
    <DataTable v-else :columns="fieldColumns" :data="rows" :is-loading="isLoading" />

    <div v-if="meta && meta.totalPages > 1" class="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">Prev</Button>
      <span class="text-sm">Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <Button variant="outline" size="sm" :disabled="page >= meta.totalPages" @click="page++">
        Next
      </Button>
    </div>
  </div>
</template>
