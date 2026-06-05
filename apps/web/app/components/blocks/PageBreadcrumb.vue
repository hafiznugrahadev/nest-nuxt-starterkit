<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';

/** TailAdmin-style page header: title on the left, breadcrumb trail on the right. */
defineProps<{ title: string; crumbs?: { label: string; to?: string }[] }>();
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-xl font-semibold tracking-tight text-foreground">{{ title }}</h1>

    <nav v-if="crumbs?.length" class="flex items-center gap-1.5 text-sm">
      <template v-for="(c, i) in crumbs" :key="i">
        <NuxtLink
          v-if="c.to"
          :to="c.to"
          class="text-muted-foreground transition-colors hover:text-foreground"
        >
          {{ c.label }}
        </NuxtLink>
        <span v-else class="text-foreground">{{ c.label }}</span>
        <ChevronRight v-if="i < crumbs.length - 1" class="h-4 w-4 text-muted-foreground" />
      </template>
    </nav>
  </div>
</template>
