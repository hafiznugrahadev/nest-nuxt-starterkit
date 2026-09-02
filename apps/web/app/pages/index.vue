<script setup lang="ts">
import { ShieldCheck, Table2, Component } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

// Public landing page — no auth required.
definePageMeta({ layout: 'public' });
useHead({ title: `${APP_NAME} — NestJS + Nuxt starter kit` });

const auth = useAuthStore();
const { t } = useI18n();

const features = computed(() => [
  {
    icon: ShieldCheck,
    title: t('home.features.auth.title'),
    text: t('home.features.auth.text'),
  },
  {
    icon: Table2,
    title: t('home.features.datatable.title'),
    text: t('home.features.datatable.text'),
  },
  {
    icon: Component,
    title: t('home.features.ui.title'),
    text: t('home.features.ui.text'),
  },
]);
</script>

<template>
  <div>
    <!-- Hero — Polygon navy with blurred orbs (lp-hero style) -->
    <section class="relative overflow-hidden bg-navy-deep">
      <div
        class="pointer-events-none absolute -right-36 -top-44 aspect-square w-[620px] rounded-full blur-[60px]"
        style="background: radial-gradient(circle, rgba(9, 86, 195, 0.32), transparent 65%)"
      />
      <div
        class="pointer-events-none absolute -bottom-32 -left-40 aspect-square w-[480px] rounded-full blur-[60px]"
        style="background: radial-gradient(circle, rgba(52, 211, 153, 0.1), transparent 65%)"
      />

      <div
        class="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:py-32"
      >
        <p class="mb-5 inline-block text-xs font-bold uppercase tracking-[0.14em] text-blue-light">
          {{ $t('home.eyebrow') }}
        </p>
        <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {{ APP_NAME }}
        </h1>
        <p class="mx-auto mt-6 max-w-xl leading-relaxed text-white/70">
          {{ $t('home.description') }}
        </p>
        <div class="mt-9 flex flex-wrap justify-center gap-3.5">
          <ClientOnly>
            <Button
              v-if="auth.isAuthenticated"
              size="lg"
              class="h-auto rounded-xl px-7 py-3.5 text-[15px]"
              @click="navigateTo('/dashboard')"
            >
              {{ $t('home.goToDashboard') }}
            </Button>
            <Button
              v-else
              size="lg"
              class="h-auto rounded-xl px-7 py-3.5 text-[15px]"
              @click="navigateTo('/login')"
            >
              {{ $t('home.signIn') }}
            </Button>
            <template #fallback>
              <Button
                size="lg"
                class="h-auto rounded-xl px-7 py-3.5 text-[15px]"
                @click="navigateTo('/login')"
              >
                {{ $t('home.signIn') }}
              </Button>
            </template>
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- Features — light surface with Polygon icon tiles -->
    <section class="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <div class="grid gap-5 sm:grid-cols-3">
        <Card v-for="f in features" :key="f.title" class="p-6">
          <div
            class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <component :is="f.icon" class="h-5 w-5" />
          </div>
          <h2 class="font-semibold text-foreground">{{ f.title }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">{{ f.text }}</p>
        </Card>
      </div>
    </section>
  </div>
</template>
