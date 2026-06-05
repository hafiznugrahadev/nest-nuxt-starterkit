<script setup lang="ts">
import { Goal, LogOut } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

const auth = useAuthStore();

async function onLogout() {
  await auth.logout();
  toast.success('Signed out');
  await navigateTo('/login');
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
    <div class="container mx-auto flex h-14 items-center justify-between px-4">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
        <Goal class="h-5 w-5 text-primary" />
        <span>{{ APP_NAME }}</span>
      </NuxtLink>

      <nav class="flex items-center gap-1">
        <Button variant="ghost" size="sm" @click="navigateTo('/fields')">Fields</Button>
        <Button variant="ghost" size="sm" @click="navigateTo('/bookings')">Bookings</Button>

        <!-- Auth state is client-only (in-memory token) — avoid hydration mismatch. -->
        <ClientOnly>
          <template v-if="auth.isAuthenticated">
            <span class="ml-2 hidden text-sm text-muted-foreground sm:inline">
              {{ auth.user?.name }}
            </span>
            <Button variant="ghost" size="sm" @click="onLogout">
              <LogOut class="h-4 w-4" />
              <span class="hidden sm:inline">Logout</span>
            </Button>
          </template>
          <template v-else>
            <Button variant="outline" size="sm" @click="navigateTo('/login')">Login</Button>
          </template>
        </ClientOnly>
      </nav>
    </div>
  </header>
</template>
