<script setup lang="ts">
// Explicit barrel import — features/ is NOT auto-imported (SPEC boundary rule).
import { UserTable } from '~/features/user';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });
useHead({ title: 'Users — Starter Kit' });
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Users</h1>
      <p class="text-sm text-muted-foreground">All registered accounts (admin only).</p>
    </div>
    <UserTable />
  </div>
</template>
