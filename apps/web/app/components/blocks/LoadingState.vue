<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';

defineProps<{ asRow?: boolean; colspan?: number }>();
</script>

<template>
  <tr v-if="asRow">
    <td :colspan="colspan" class="p-8 text-center text-sm text-muted-foreground">
      <Loader2 class="mx-auto h-5 w-5 animate-spin" />
    </td>
  </tr>
  <div v-else class="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
    <Loader2 class="h-5 w-5 animate-spin" />
    <span>{{ $t('state.loading') }}</span>
  </div>
</template>
