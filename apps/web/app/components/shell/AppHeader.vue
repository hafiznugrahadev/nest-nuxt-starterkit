<script setup lang="ts">
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-vue-next';
import { useCommandPalette } from '~/composables/useCommandPalette';

const { toggleMobile, toggleExpanded, isExpanded, isMobileOpen } = useSidebar();
const { openPalette } = useCommandPalette();
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
    <div class="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
      <!-- Left: sidebar toggles + search -->
      <div class="flex flex-1 items-center gap-3">
        <!-- Mobile: open off-canvas drawer · Desktop: collapse to icon rail -->
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          :aria-label="isMobileOpen ? 'Close menu' : 'Open menu'"
          @click="toggleMobile"
        >
          <component :is="isMobileOpen ? PanelLeftClose : PanelLeftOpen" class="h-5 w-5" />
        </button>
        <button
          type="button"
          class="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
          :aria-label="isExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
          @click="toggleExpanded"
        >
          <component :is="isExpanded ? PanelLeftClose : PanelLeftOpen" class="h-5 w-5" />
        </button>

        <button
          type="button"
          class="relative hidden max-w-md flex-1 cursor-text items-center sm:flex"
          @click="openPalette"
        >
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <span
            class="flex h-9 w-full items-center rounded-lg border border-border bg-background pl-10 pr-16 text-sm text-muted-foreground"
          >
            {{ $t('commandPalette.placeholder') }}
          </span>
          <span
            class="absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground md:inline-flex"
          >
            ⌘ K
          </span>
        </button>
      </div>

      <!-- Right: actions -->
      <div class="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationPanel />
        <UserMenu />
      </div>
    </div>
  </header>
</template>
