<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuthStore } from '~/stores/auth';

/**
 * The authenticated-user dropdown (avatar → Profile / Sign out). Shared between
 * the top-right header and the sidebar footer.
 * - `variant`: `compact` = header trigger (avatar + optional name); `full` = a
 *   full-width row (avatar + name/email) for the sidebar footer.
 * - `placement`: which way the menu opens (`down` for header, `up` for footer).
 * - `showDetails`: hide name/email text in the collapsed sidebar rail.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'compact' | 'full';
    placement?: 'down' | 'up';
    showDetails?: boolean;
  }>(),
  { variant: 'compact', placement: 'down', showDetails: true },
);

const auth = useAuthStore();
const open = ref(false);

async function onLogout() {
  open.value = false;
  await auth.logout();
  toast.success('Signed out');
  await navigateTo('/login');
}

function go(path: string) {
  open.value = false;
  navigateTo(path);
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

const panelClass = computed(() =>
  props.placement === 'up' ? 'bottom-full mb-2 left-0 min-w-[14rem]' : 'top-full mt-2 right-0 w-56',
);
</script>

<template>
  <ClientOnly>
    <div v-if="auth.isAuthenticated" class="relative">
      <!-- Trigger -->
      <button
        type="button"
        :class="
          variant === 'full'
            ? 'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent'
            : 'flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-accent'
        "
        @click="open = !open"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white"
        >
          {{ initials }}
        </span>

        <template v-if="showDetails">
          <span v-if="variant === 'full'" class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-foreground">
              {{ auth.user?.name }}
            </span>
            <span class="block truncate text-xs text-muted-foreground">{{ auth.user?.email }}</span>
          </span>
          <span v-else class="hidden text-sm font-medium text-foreground sm:inline">
            {{ auth.user?.name }}
          </span>
          <ChevronDown
            :class="[
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              variant === 'compact' && 'hidden sm:inline',
              open && 'rotate-180',
            ]"
          />
        </template>
      </button>

      <!-- Dropdown -->
      <template v-if="open">
        <!-- click-away catcher -->
        <button class="fixed inset-0 z-40 cursor-default" @click="open = false" />
        <div
          :class="[
            'absolute z-50 overflow-hidden rounded-xl border border-border bg-card shadow-theme-md',
            panelClass,
          ]"
        >
          <div class="border-b border-border px-4 py-3">
            <p class="truncate text-sm font-medium text-foreground">{{ auth.user?.name }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ auth.user?.email }}</p>
          </div>
          <div class="p-1.5">
            <button
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              @click="go('/profile')"
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

    <!-- Logged out -->
    <Button
      v-else
      variant="outline"
      :size="variant === 'full' ? 'default' : 'sm'"
      :class="variant === 'full' ? 'w-full' : undefined"
      @click="navigateTo('/login')"
    >
      Login
    </Button>

    <template #fallback>
      <div
        :class="
          variant === 'full' ? 'h-12 w-full rounded-xl bg-muted' : 'h-9 w-20 rounded-full bg-muted'
        "
      />
    </template>
  </ClientOnly>
</template>
