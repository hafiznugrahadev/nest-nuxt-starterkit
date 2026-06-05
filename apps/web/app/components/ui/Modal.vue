<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui';
import { X } from 'lucide-vue-next';

/** Reusable modal dialog (reka-ui). Control with `v-model:open`. */
const open = defineModel<boolean>('open', { default: false });
defineProps<{ title?: string; description?: string }>();
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-theme-md focus:outline-none"
      >
        <div class="mb-5 flex items-start justify-between gap-4">
          <div class="space-y-1">
            <DialogTitle v-if="title" class="text-lg font-semibold text-foreground">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="text-sm text-muted-foreground">
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose
            class="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X class="h-5 w-5" />
          </DialogClose>
        </div>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
