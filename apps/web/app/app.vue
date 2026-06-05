<script setup lang="ts">
import { Toaster } from 'vue-sonner';
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Global toast outlet (vue-sonner). Client-only — it touches the DOM directly. -->
  <ClientOnly>
    <Toaster rich-colors position="top-right" />
  </ClientOnly>
</template>
