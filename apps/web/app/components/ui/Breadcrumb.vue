<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';

export interface Crumb {
  label: string;
  to?: string;
}

/** Reusable, accessible breadcrumb trail. The last item is marked as current. */
const props = defineProps<{ items: Crumb[]; class?: string }>();
</script>

<template>
  <nav aria-label="Breadcrumb" :class="props.class">
    <ol class="flex items-center gap-1.5 text-sm">
      <li v-for="(item, i) in items" :key="i" class="flex items-center gap-1.5">
        <NuxtLink
          v-if="item.to && i < items.length - 1"
          :to="item.to"
          class="text-muted-foreground transition-colors hover:text-foreground"
        >
          {{ item.label }}
        </NuxtLink>
        <span
          v-else
          class="text-foreground"
          :aria-current="i === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
        <ChevronRight
          v-if="i < items.length - 1"
          class="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>
