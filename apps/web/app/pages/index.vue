<script setup lang="ts">
import { Boxes, ShieldCheck, Table2, Component } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

const auth = useAuthStore();

const features = [
  {
    icon: ShieldCheck,
    title: 'Auth',
    text: 'JWT access + rotating refresh cookie, guards & RBAC.',
  },
  {
    icon: Table2,
    title: 'Datatable',
    text: 'Paginated, searchable tables over a typed API client.',
  },
  {
    icon: Component,
    title: 'Reusable UI',
    text: 'shadcn-vue primitives, form fields & state blocks.',
  },
];
</script>

<template>
  <section class="mx-auto max-w-3xl space-y-10">
    <div class="space-y-5 text-center">
      <div class="flex justify-center">
        <Boxes class="h-14 w-14 text-primary" />
      </div>
      <h1 class="text-3xl font-bold tracking-tight">{{ APP_NAME }}</h1>
      <p class="mx-auto max-w-xl text-muted-foreground">
        A NestJS + Nuxt monorepo starter kit — authentication, a users datatable, and a set of
        reusable components to build on.
      </p>
      <div class="flex justify-center gap-3">
        <ClientOnly>
          <Button v-if="auth.isAdmin" @click="navigateTo('/users')">Open users</Button>
          <Button v-else-if="auth.isAuthenticated" disabled>Signed in</Button>
          <Button v-else @click="navigateTo('/login')">Sign in</Button>
          <template #fallback>
            <Button @click="navigateTo('/login')">Sign in</Button>
          </template>
        </ClientOnly>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <Card v-for="f in features" :key="f.title" class="p-5">
        <component :is="f.icon" class="mb-3 h-6 w-6 text-primary" />
        <h2 class="font-semibold">{{ f.title }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ f.text }}</p>
      </Card>
    </div>
  </section>
</template>
