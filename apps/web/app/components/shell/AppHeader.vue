<script setup lang="ts">
import { Bell, Menu, Search } from 'lucide-vue-next';

const { toggleMobile, toggleExpanded } = useSidebar();
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

        <UserMenu />
      </div>
    </div>
  </header>
</template>
