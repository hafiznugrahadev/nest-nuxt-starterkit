<script setup lang="ts">
import type { Crumb } from '~/components/ui/Breadcrumb.vue';

/** TailAdmin-style page header: title on the left, reusable breadcrumb on the right. */
defineProps<{ title: string; crumbs?: Crumb[] }>();
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-xl font-semibold tracking-tight text-foreground">{{ title }}</h1>
    <Breadcrumb v-if="crumbs?.length" :items="crumbs" />
  </div>
</template>
