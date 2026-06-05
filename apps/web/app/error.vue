<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{ error: NuxtError }>();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
    <h1 class="text-4xl font-bold">{{ error.statusCode }}</h1>
    <p class="text-muted-foreground">{{ error.statusMessage || 'Unexpected error' }}</p>
    <Button @click="clearError({ redirect: '/' })">Back home</Button>
  </div>
</template>
