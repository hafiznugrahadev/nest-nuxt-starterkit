<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{ error: NuxtError }>();
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-6 text-center"
  >
    <p class="text-7xl font-bold tracking-tight text-brand-500">{{ error.statusCode }}</p>
    <div class="space-y-1">
      <h1 class="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p class="text-sm text-muted-foreground">
        {{ error.statusMessage || 'The page you are looking for could not be found.' }}
      </p>
    </div>
    <Button size="lg" @click="clearError({ redirect: '/' })">Back to dashboard</Button>
  </div>
</template>
