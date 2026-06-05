<script setup lang="ts">
import { Boxes } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

const auth = useAuthStore();
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <header class="border-b border-border">
      <div
        class="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-4 sm:px-6"
      >
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold text-foreground">
          <Boxes class="h-5 w-5 text-brand-500" />
          {{ APP_NAME }}
        </NuxtLink>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <!-- Auth state is client-only (in-memory token) — avoid hydration mismatch. -->
          <ClientOnly>
            <Button v-if="auth.isAuthenticated" size="sm" @click="navigateTo('/dashboard')">
              Dashboard
            </Button>
            <Button v-else size="sm" @click="navigateTo('/login')">Sign in</Button>
            <template #fallback>
              <Button size="sm" @click="navigateTo('/login')">Sign in</Button>
            </template>
          </ClientOnly>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
