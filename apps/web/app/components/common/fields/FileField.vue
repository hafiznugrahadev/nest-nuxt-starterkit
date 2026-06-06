<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef, ref } from 'vue';
import { cn } from '~/lib/utils';
import { Paperclip, X } from 'lucide-vue-next';

const props = defineProps<{
  name: string;
  label?: string;
  placeholder?: string;
  accept?: string;
  required?: boolean;
}>();

const { value, errorMessage } = useField<File | undefined>(toRef(props, 'name'));
const inputRef = ref<HTMLInputElement | null>(null);

function onFileChange(e: Event) {
  value.value = (e.target as HTMLInputElement).files?.[0] ?? undefined;
}

function clear() {
  value.value = undefined;
  if (inputRef.value) inputRef.value.value = '';
}
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="name" class="text-sm font-medium leading-none">
      {{ label }}<span v-if="required" class="ml-0.5 text-destructive">*</span>
    </label>
    <div
      :class="
        cn(
          'flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background text-sm shadow-sm',
          errorMessage && 'border-destructive',
        )
      "
    >
      <button
        type="button"
        class="flex h-full shrink-0 items-center gap-1.5 border-r border-input bg-muted px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        @click="inputRef?.click()"
      >
        <Paperclip class="h-3.5 w-3.5" />
        Choose file
      </button>
      <span
        class="flex-1 truncate px-3"
        :class="value ? 'text-foreground' : 'text-muted-foreground'"
      >
        {{ value?.name ?? placeholder ?? 'No file chosen' }}
      </span>
      <button
        v-if="value"
        type="button"
        class="mr-2 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Remove file"
        @click="clear"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
    <input
      :id="name"
      ref="inputRef"
      type="file"
      class="sr-only"
      :accept="accept"
      @change="onFileChange"
    />
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
