<script setup lang="ts">
import { Menu, Search } from 'lucide-vue-next';
import { useCommandPalette } from '~/composables/useCommandPalette';

const { toggleMobile, toggleExpanded } = useSidebar();
const { openPalette } = useCommandPalette();
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

        <button
          type="button"
          class="relative hidden max-w-md flex-1 cursor-text items-center sm:flex"
          @click="openPalette"
        >
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <span
            class="flex items-center h-11 w-full rounded-lg border border-border bg-background pl-10 pr-16 text-sm text-muted-foreground"
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
