<script setup lang="ts">
import { Boxes, LayoutGrid, Users, type LucideIcon } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

const auth = useAuthStore();
const route = useRoute();
const { isExpanded, isMobileOpen, closeMobile } = useSidebar();

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

// Only existing routes — kept minimal per the starter kit's surface.
const items: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid },
  { label: 'Users', to: '/users', icon: Users, adminOnly: true },
];

const visibleItems = computed(() =>
  items.filter((i) => !i.adminOnly || (auth.isAuthenticated && auth.isAdmin)),
);

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/');
}

// The icon-only rail is a desktop concept; the mobile drawer is always full.
const showFull = computed(() => isMobileOpen.value || isExpanded.value);
</script>

<template>
  <!-- Mobile backdrop -->
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
    @click="closeMobile"
  />

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-[width,transform] duration-300 ease-in-out',
      'w-[290px]',
      isExpanded ? 'lg:w-[290px]' : 'lg:w-[90px]',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Brand -->
    <div
      :class="[
        'flex h-16 items-center border-b border-border',
        showFull ? 'px-6' : 'justify-center px-0',
      ]"
    >
      <NuxtLink
        to="/dashboard"
        class="flex items-center gap-2.5 font-semibold"
        @click="closeMobile"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white"
        >
          <Boxes class="h-5 w-5" />
        </span>
        <span v-if="showFull" class="text-lg tracking-tight text-foreground">{{ APP_NAME }}</span>
      </NuxtLink>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-4 py-5">
      <p
        :class="[
          'mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
          showFull ? 'px-2' : 'text-center',
        ]"
      >
        {{ showFull ? 'Menu' : '•••' }}
      </p>
      <ul class="space-y-1.5">
        <li v-for="item in visibleItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            :class="[
              'group flex items-center rounded-lg text-sm font-medium transition-colors',
              showFull ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
              isActive(item.to)
                ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/15'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            ]"
            @click="closeMobile"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            <span v-if="showFull">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Footer — user dropdown (same menu as the top-right header) -->
    <div :class="['border-t border-border', showFull ? 'p-3' : 'flex justify-center p-2']">
      <UserMenu variant="full" placement="up" :show-details="showFull" />
    </div>
  </aside>
</template>
