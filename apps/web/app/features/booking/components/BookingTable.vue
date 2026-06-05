<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBookings } from '../composables/useBookings';
import { bookingColumns } from './booking-columns';
import type { BookingListParams } from '../types';

const page = ref(1);

const params = computed<BookingListParams>(() => ({ page: page.value, limit: 10 }));

const { data, isLoading, isError, error, refetch } = useBookings(params);
const rows = computed(() => data.value?.data ?? []);
const meta = computed(() => data.value?.meta);
</script>

<template>
  <div class="space-y-4">
    <ErrorState v-if="isError" :message="(error as Error)?.message" @retry="refetch()" />
    <template v-else>
      <EmptyState
        v-if="!isLoading && rows.length === 0"
        title="No bookings yet"
        description="Create your first booking to see it here."
      />
      <DataTable v-else :columns="bookingColumns" :data="rows" :is-loading="isLoading" />
    </template>

    <div v-if="meta && meta.totalPages > 1" class="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">Prev</Button>
      <span class="text-sm">Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <Button variant="outline" size="sm" :disabled="page >= meta.totalPages" @click="page++">
        Next
      </Button>
    </div>
  </div>
</template>
