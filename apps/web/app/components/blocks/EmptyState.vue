<script setup lang="ts">
import { Inbox } from 'lucide-vue-next';

defineProps<{
  title?: string;
  description?: string;
  asRow?: boolean;
  colspan?: number;
}>();
</script>

<template>
  <tr v-if="asRow">
    <td :colspan="colspan" class="p-8 text-center text-sm text-muted-foreground">
      {{ title ?? 'No data yet' }}
    </td>
  </tr>
  <div v-else class="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <Inbox class="h-10 w-10 text-muted-foreground" />
    <p class="text-sm font-medium">{{ title ?? 'No data yet' }}</p>
    <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
    <slot />
  </div>
</template>
