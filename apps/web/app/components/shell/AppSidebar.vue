<script setup lang="ts">
import { Boxes, FlaskConical, LayoutGrid, Users, type LucideIcon } from 'lucide-vue-next';
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
  { label: 'nav.dashboard', to: '/dashboard', icon: LayoutGrid },
  { label: 'nav.users', to: '/users', icon: Users, adminOnly: true },
  { label: 'nav.fieldsDemo', to: '/demo/fields', icon: FlaskConical },
];

// Auth roles are only known on the client (the access token lives in memory), so
// admin-only items must stay hidden until after mount. Rendering them during SSR
// — or on the client's first (hydration) pass — would make the server nav (guest
// view) and the hydrated client nav (authed view) diverge, which Vue reports as a
// hydration mismatch. `import.meta.client` is already true during hydration, so a
// post-mount flag is what keeps the first client render identical to the server's.
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

const visibleItems = computed(() =>
  items.filter((i) => !i.adminOnly || (mounted.value && auth.isAuthenticated && auth.isAdmin)),
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
    class="bg-background-overlay fixed inset-0 z-40 lg:hidden"
    @click="closeMobile"
  />

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-300 ease-in-out',
      'w-60',
      isExpanded ? 'lg:w-60' : 'lg:w-[90px]',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Brand -->
    <div :class="['flex h-14 items-center', showFull ? 'px-5' : 'justify-center px-0']">
      <NuxtLink
        to="/dashboard"
        class="flex items-center gap-2.5 font-semibold"
        @click="closeMobile"
      >
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white"
        >
          <Boxes class="h-[18px] w-[18px]" />
        </span>
        <span v-if="showFull" class="text-base tracking-tight text-foreground">{{ APP_NAME }}</span>
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
        {{ showFull ? $t('nav.menu') : '•••' }}
      </p>
      <ul class="space-y-1.5">
        <li v-for="item in visibleItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            :class="[
              'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
              showFull ? 'gap-3 px-3 py-2' : 'justify-center px-0 py-2',
              isActive(item.to)
                ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-primary'
                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            ]"
            @click="closeMobile"
          >
            <component :is="item.icon" class="h-[18px] w-[18px] shrink-0" />
            <span v-if="showFull">{{ $t(item.label) }}</span>
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
