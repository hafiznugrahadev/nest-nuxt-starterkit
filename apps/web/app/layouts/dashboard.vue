<script setup lang="ts">
const { isExpanded } = useSidebar();
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppSidebar />

    <!-- Content shifts to make room for the fixed sidebar on desktop. -->
    <div
      :class="[
        'min-h-screen transition-[margin] duration-300 ease-in-out',
        isExpanded ? 'lg:ml-[290px]' : 'lg:ml-[90px]',
      ]"
    >
      <AppHeader />
      <main class="mx-auto w-full max-w-screen-2xl p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
