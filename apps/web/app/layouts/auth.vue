<script setup lang="ts">
import { Boxes } from 'lucide-vue-next';
import { APP_NAME } from '~/lib/constants';
</script>

<template>
  <div class="relative grid min-h-screen lg:grid-cols-2">
    <!-- Language + theme, top-right -->
    <div class="absolute right-5 top-5 z-10 flex items-center gap-2">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>

    <!-- Form side -->
    <div class="flex items-center justify-center bg-background px-5 py-12">
      <div class="w-full max-w-sm">
        <slot />
      </div>
    </div>

    <!-- Brand side — Polygon navy with blurred orbs (lp-hero style) -->
    <div class="relative hidden items-center justify-center overflow-hidden bg-navy-deep lg:flex">
      <div
        class="pointer-events-none absolute -right-36 -top-44 aspect-square w-[620px] rounded-full blur-[60px]"
        style="background: radial-gradient(circle, rgba(9, 86, 195, 0.32), transparent 65%)"
      />
      <div
        class="pointer-events-none absolute -bottom-32 -left-40 aspect-square w-[480px] rounded-full blur-[60px]"
        style="background: radial-gradient(circle, rgba(52, 211, 153, 0.1), transparent 65%)"
      />
      <div
        class="absolute inset-0 opacity-30"
        style="
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
          background-size: 40px 40px;
        "
      />
      <div class="relative z-10 max-w-md px-8 text-center text-white">
        <div
          class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur"
        >
          <Boxes class="h-8 w-8" />
        </div>
        <h2 class="text-2xl font-semibold tracking-tight">{{ APP_NAME }}</h2>
        <p class="mt-3 text-sm text-white/70">{{ $t('appTagline') }}</p>
      </div>
    </div>
  </div>
</template>
