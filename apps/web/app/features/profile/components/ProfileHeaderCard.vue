<script setup lang="ts">
import { computed } from 'vue';
import { Mail, ShieldCheck } from 'lucide-vue-next';
import type { User } from '@starterkit/shared-types';

const props = defineProps<{ user: User }>();

const initials = computed(() => {
  const name = props.user.name?.trim();
  if (!name) return 'U';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
});

const primaryRole = computed(() => props.user.roles?.[0] ?? 'USER');
</script>

<template>
  <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
    <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <span
        class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-500 text-2xl font-semibold text-white"
      >
        {{ initials }}
      </span>

      <div class="flex-1 text-center sm:text-left">
        <h2 class="text-xl font-semibold text-foreground">{{ user.name }}</h2>
        <div
          class="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:justify-start"
        >
          <span class="inline-flex items-center gap-1.5">
            <ShieldCheck class="h-4 w-4" />
            {{ primaryRole }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Mail class="h-4 w-4" />
            {{ user.email }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap justify-center gap-2 sm:justify-end">
        <Badge v-for="role in user.roles" :key="role" variant="muted">{{ role }}</Badge>
      </div>
    </div>
  </div>
</template>
