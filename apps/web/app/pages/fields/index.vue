<script setup lang="ts">
// Explicit barrel import — features/ is NOT auto-imported (SPEC boundary rule).
import { FieldTable } from '~/features/field';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Fields — Mini Soccer' });
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Fields</h1>
      <p class="text-sm text-muted-foreground">Available mini soccer fields.</p>
    </div>
    <FieldTable />
  </div>
</template>
