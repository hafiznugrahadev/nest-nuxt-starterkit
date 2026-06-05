<script setup lang="ts">
// Explicit barrel import — features/ is NOT auto-imported (SPEC boundary rule).
import { UserTable } from '~/features/user';
import { APP_NAME } from '~/lib/constants';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });
useHead({ title: `Users — ${APP_NAME}` });
</script>

<template>
  <div class="space-y-6">
    <PageBreadcrumb
      title="Users"
      :crumbs="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Users' }]"
    />

    <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
      <div class="mb-5">
        <h2 class="text-base font-semibold text-foreground">All accounts</h2>
        <p class="text-sm text-muted-foreground">
          Registered users across the workspace (admin only).
        </p>
      </div>
      <UserTable />
    </div>
  </div>
</template>
