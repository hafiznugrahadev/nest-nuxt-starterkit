<script setup lang="ts">
import { ref } from 'vue';
import { Bell, ChevronDown, LogOut, Menu, Search, User as UserIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const { toggleMobile, toggleExpanded } = useSidebar();

const menuOpen = ref(false);

async function onLogout() {
  menuOpen.value = false;
  await auth.logout();
  toast.success('Signed out');
  await navigateTo('/login');
}

const initials = computed(() => {
  const name = auth.user?.name?.trim();
  if (!name) return 'U';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
});
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
  >
    <div class="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
      <!-- Left: sidebar toggles + search -->
      <div class="flex flex-1 items-center gap-3">
        <!-- Mobile: open off-canvas drawer · Desktop: collapse to icon rail -->
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Open menu"
          @click="toggleMobile"
        >
          <Menu class="h-5 w-5" />
        </button>
        <button
          type="button"
          class="hidden h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
          aria-label="Collapse sidebar"
          @click="toggleExpanded"
        >
          <Menu class="h-5 w-5" />
        </button>

        <div class="relative hidden max-w-md flex-1 sm:block">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Search or type command…"
            class="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <span
            class="absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground md:inline-flex"
          >
            ⌘ K
          </span>
        </div>
      </div>

      <!-- Right: actions -->
      <div class="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        <button
          type="button"
          class="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell class="h-5 w-5" />
          <span
            class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-card"
          />
        </button>

        <!-- User menu -->
        <ClientOnly>
          <div v-if="auth.isAuthenticated" class="relative">
            <button
              type="button"
              class="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-accent"
              @click="menuOpen = !menuOpen"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white"
              >
                {{ initials }}
              </span>
              <span class="hidden text-sm font-medium text-foreground sm:inline">
                {{ auth.user?.name }}
              </span>
              <ChevronDown class="hidden h-4 w-4 text-muted-foreground sm:inline" />
            </button>

            <template v-if="menuOpen">
              <!-- click-away catcher -->
              <button class="fixed inset-0 z-40 cursor-default" @click="menuOpen = false" />
              <div
                class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-theme-md"
              >
                <div class="border-b border-border px-4 py-3">
                  <p class="truncate text-sm font-medium text-foreground">{{ auth.user?.name }}</p>
                  <p class="truncate text-xs text-muted-foreground">{{ auth.user?.email }}</p>
                </div>
                <div class="p-1.5">
                  <button
                    class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    @click="menuOpen = false"
                  >
                    <UserIcon class="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    @click="onLogout"
                  >
                    <LogOut class="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </template>
          </div>
          <Button v-else variant="outline" size="sm" @click="navigateTo('/login')">Login</Button>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>
