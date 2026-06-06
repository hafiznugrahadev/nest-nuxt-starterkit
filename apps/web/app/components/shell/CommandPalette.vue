<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent } from 'reka-ui';
import { LayoutDashboard, Users, User, Search } from 'lucide-vue-next';
import { useCommandPalette } from '~/composables/useCommandPalette';

const { t } = useI18n();
const router = useRouter();
const { open, closePalette } = useCommandPalette();

const query = ref('');
const activeIndex = ref(0);

interface Command {
  label: string;
  icon: typeof Search;
  action: () => void;
}

const allCommands = computed<Command[]>(() => [
  { label: t('nav.dashboard'), icon: LayoutDashboard, action: () => router.push('/dashboard') },
  { label: t('nav.users'), icon: Users, action: () => router.push('/users') },
  { label: t('nav.profile'), icon: User, action: () => router.push('/profile') },
]);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return allCommands.value;
  return allCommands.value.filter((c) => c.label.toLowerCase().includes(q));
});

watch(open, (val) => {
  if (val) {
    query.value = '';
    activeIndex.value = 0;
    nextTick(() => {
      (document.getElementById('cp-input') as HTMLInputElement | null)?.focus();
    });
  }
});

watch(filtered, () => {
  activeIndex.value = 0;
});

function execute(cmd: Command) {
  closePalette();
  cmd.action();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % (filtered.value.length || 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value =
      (activeIndex.value - 1 + (filtered.value.length || 1)) % (filtered.value.length || 1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const cmd = filtered.value[activeIndex.value];
    if (cmd) execute(cmd);
  } else if (e.key === 'Escape') {
    closePalette();
  }
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
      <DialogContent
        class="fixed left-1/2 top-[20%] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-card shadow-xl focus:outline-none"
        @escape-key-down="closePalette"
      >
        <!-- Search input -->
        <div class="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            id="cp-input"
            v-model="query"
            type="text"
            :placeholder="$t('commandPalette.placeholder')"
            class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            @keydown="onKeydown"
          />
          <kbd
            class="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline"
            >Esc</kbd
          >
        </div>

        <!-- Results -->
        <div class="py-2">
          <p
            v-if="filtered.length === 0"
            class="px-4 py-6 text-center text-sm text-muted-foreground"
          >
            {{ $t('commandPalette.noResults') }}
          </p>
          <template v-else>
            <p class="px-4 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {{ $t('commandPalette.navigation') }}
            </p>
            <ul>
              <li
                v-for="(cmd, i) in filtered"
                :key="cmd.label"
                class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                :class="
                  i === activeIndex
                    ? 'bg-accent text-foreground'
                    : 'text-foreground hover:bg-muted/50'
                "
                @mouseenter="activeIndex = i"
                @click="execute(cmd)"
              >
                <component :is="cmd.icon" class="h-4 w-4 shrink-0 text-muted-foreground" />
                {{ cmd.label }}
              </li>
            </ul>
          </template>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
