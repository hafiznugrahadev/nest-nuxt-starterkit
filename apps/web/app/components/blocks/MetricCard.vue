<script setup lang="ts">
import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-vue-next';

/**
 * TailAdmin-style KPI card: an icon tile, a label + value, and a trend badge.
 */
const props = defineProps<{
  label: string;
  value: string;
  icon: LucideIcon;
  change?: number; // signed percentage; positive = up
}>();

const isUp = computed(() => (props.change ?? 0) >= 0);
</script>

<template>
  <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground">
      <component :is="icon" class="h-6 w-6" />
    </div>

    <div class="mt-5 flex items-end justify-between gap-3">
      <div>
        <p class="text-sm text-muted-foreground">{{ label }}</p>
        <p class="mt-1 text-2xl font-bold tracking-tight text-foreground">{{ value }}</p>
      </div>

      <span
        v-if="change !== undefined"
        :class="[
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
          isUp
            ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
            : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
        ]"
      >
        <component :is="isUp ? ArrowUp : ArrowDown" class="h-3 w-3" />
        {{ Math.abs(change).toFixed(2) }}%
      </span>
    </div>
  </div>
</template>
