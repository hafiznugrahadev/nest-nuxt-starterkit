<script setup lang="ts">
import { ShieldCheck, Table2, Component } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

// Public landing page — no auth required.
definePageMeta({ layout: 'public' });
useHead({ title: `${APP_NAME} — NestJS + Nuxt starter kit` });

const auth = useAuthStore();

const features = [
  {
    icon: ShieldCheck,
    title: 'Auth & RBAC',
    text: 'JWT access + rotating refresh cookie, roles & guards.',
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
  <section class="mx-auto max-w-3xl space-y-10 px-4 py-16 sm:py-24">
    <div class="space-y-5 text-center">
      <h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{{ APP_NAME }}</h1>
      <p class="mx-auto max-w-xl text-muted-foreground">
        A NestJS + Nuxt monorepo starter kit — authentication, role-based access, a users datatable,
        and reusable components to build on.
      </p>
      <div class="flex justify-center gap-3">
        <ClientOnly>
          <Button v-if="auth.isAuthenticated" @click="navigateTo('/dashboard')">
            Go to dashboard
          </Button>
          <Button v-else @click="navigateTo('/login')">Sign in</Button>
          <template #fallback>
            <Button @click="navigateTo('/login')">Sign in</Button>
          </template>
        </ClientOnly>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <Card v-for="f in features" :key="f.title" class="p-5">
        <component :is="f.icon" class="mb-3 h-6 w-6 text-brand-500" />
        <h2 class="font-semibold text-foreground">{{ f.title }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ f.text }}</p>
      </Card>
    </div>
  </section>
</template>
