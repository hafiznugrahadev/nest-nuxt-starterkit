<script setup lang="ts">
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, Inbox } from 'lucide-vue-next';
import { PopoverRoot, PopoverTrigger, PopoverContent } from 'reka-ui';
import { useNotificationsStore } from '~/stores/notifications';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const store = useNotificationsStore();
const open = ref(false);

watch(open, (val) => {
  if (val && auth.isAuthenticated && !store.fetched) {
    store.fetch();
  }
});

const typeIcon: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};
const typeClass: Record<string, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-destructive',
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function handleClick(id: string) {
  await store.markRead(id);
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        :aria-label="$t('notifications.title')"
      >
        <Bell class="h-5 w-5" />
        <span
          v-if="store.unreadCount > 0"
          class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-card"
        />
      </button>
    </PopoverTrigger>

    <PopoverContent
      align="end"
      :side-offset="8"
      class="z-50 w-80 rounded-2xl border border-border bg-card shadow-lg outline-none"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <span class="text-sm font-semibold text-foreground">{{ $t('notifications.title') }}</span>
        <button
          v-if="store.unreadCount > 0"
          type="button"
          class="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
          @click="store.markAllRead()"
        >
          <Check class="h-3.5 w-3.5" />
          {{ $t('notifications.markAllRead') }}
        </button>
      </div>

      <!-- List -->
      <div class="max-h-80 overflow-y-auto">
        <div v-if="store.loading" class="flex items-center justify-center py-8">
          <span class="text-sm text-muted-foreground">{{ $t('state.loading') }}</span>
        </div>

        <div
          v-else-if="store.notifications.length === 0"
          class="flex flex-col items-center justify-center gap-1 py-8 text-center"
        >
          <Inbox class="h-8 w-8 text-muted-foreground" />
          <p class="text-sm font-medium text-foreground">{{ $t('notifications.empty') }}</p>
          <p class="text-xs text-muted-foreground">{{ $t('notifications.emptyHint') }}</p>
        </div>

        <ul v-else>
          <li
            v-for="n in store.notifications"
            :key="n.id"
            class="flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            :class="{ 'bg-brand-50/40 dark:bg-brand-500/5': !n.readAt }"
            @click="handleClick(n.id)"
          >
            <component
              :is="typeIcon[n.type] ?? Info"
              class="mt-0.5 h-4 w-4 shrink-0"
              :class="typeClass[n.type] ?? 'text-muted-foreground'"
            />
            <div class="min-w-0 flex-1">
              <p
                class="text-sm font-medium text-foreground"
                :class="{ 'font-semibold': !n.readAt }"
              >
                {{ n.title }}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ n.body }}</p>
              <p class="mt-1 text-xs text-muted-foreground/70">{{ relativeTime(n.createdAt) }}</p>
            </div>
            <span v-if="!n.readAt" class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
          </li>
        </ul>
      </div>
    </PopoverContent>
  </PopoverRoot>
</template>
