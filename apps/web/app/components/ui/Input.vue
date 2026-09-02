<script setup lang="ts">
import { cn } from '~/lib/utils';

const props = defineProps<{ class?: string }>();
const model = defineModel<string | number>();
</script>

<template>
  <input
    v-model="model"
    :class="
      cn(
        'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
