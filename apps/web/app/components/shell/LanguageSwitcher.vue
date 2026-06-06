<script setup lang="ts">
import { computed, ref } from 'vue';
import { Check, Languages } from 'lucide-vue-next';

const { locale, locales, setLocale } = useI18n();
const open = ref(false);

const available = computed(() => locales.value as Array<{ code: string; name: string }>);
const current = computed(() => locale.value.toUpperCase());

async function choose(code: string) {
  await setLocale(code as never);
  open.value = false;
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      data-testid="language-switcher"
      class="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      :aria-label="$t('language')"
      @click="open = !open"
    >
      <Languages class="h-4 w-4" />
      <span>{{ current }}</span>
    </button>

    <template v-if="open">
      <button class="fixed inset-0 z-40 cursor-default" @click="open = false" />
      <div
        class="absolute right-0 top-full z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-theme-md"
      >
        <button
          v-for="l in available"
          :key="l.code"
          class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          @click="choose(l.code)"
        >
          {{ l.name }}
          <Check v-if="l.code === locale" class="h-4 w-4 text-brand-500" />
        </button>
      </div>
    </template>
  </div>
</template>
