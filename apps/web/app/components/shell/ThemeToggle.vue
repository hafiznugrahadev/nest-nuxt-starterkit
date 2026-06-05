<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';

const { isDark, toggle } = useTheme();
</script>

<template>
  <!-- Client-only: theme is resolved on the client, avoid hydration mismatch. -->
  <ClientOnly>
    <button
      type="button"
      class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggle"
    >
      <Moon v-if="isDark" class="h-5 w-5" />
      <Sun v-else class="h-5 w-5" />
    </button>
    <template #fallback>
      <div class="h-11 w-11 rounded-full border border-border bg-card" />
    </template>
  </ClientOnly>
</template>
