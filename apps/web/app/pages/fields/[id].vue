<script setup lang="ts">
import { useFieldApi } from '~/features/field';
import { formatIDR } from '~/lib/utils';

definePageMeta({ layout: 'dashboard' });

const route = useRoute();
const fieldApi = useFieldApi();
const { data: field, pending } = await useAsyncData(`field-${route.params.id}`, () =>
  fieldApi.get(route.params.id as string),
);
</script>

<template>
  <LoadingState v-if="pending" />
  <Card v-else-if="field" class="max-w-xl space-y-3 p-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ field.name }}</h1>
      <Badge>{{ field.status }}</Badge>
    </div>
    <p class="text-sm text-muted-foreground">{{ field.description }}</p>
    <dl class="grid grid-cols-2 gap-2 text-sm">
      <dt class="text-muted-foreground">Type</dt>
      <dd>{{ field.type }}</dd>
      <dt class="text-muted-foreground">Price / hour</dt>
      <dd>{{ formatIDR(field.pricePerHour) }}</dd>
    </dl>
  </Card>
  <EmptyState v-else title="Field not found" />
</template>
