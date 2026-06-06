<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef, computed } from 'vue';
import { cn } from '~/lib/utils';
import {
  TagsInputRoot,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
} from 'reka-ui';
import { X } from 'lucide-vue-next';

const props = defineProps<{
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}>();

const { value, errorMessage } = useField<string[]>(toRef(props, 'name'));

const tags = computed({
  get: () => value.value ?? [],
  set: (v: string[]) => {
    value.value = v;
  },
});
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="name" class="text-sm font-medium leading-none">
      {{ label }}<span v-if="required" class="ml-0.5 text-destructive">*</span>
    </label>
    <TagsInputRoot
      :id="name"
      v-model="tags"
      :class="
        cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-within:ring-2 focus-within:ring-ring',
          errorMessage && 'border-destructive focus-within:ring-destructive',
        )
      "
    >
      <TagsInputItem
        v-for="tag in tags"
        :key="tag"
        :value="tag"
        class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
      >
        <TagsInputItemText />
        <TagsInputItemDelete
          class="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X class="h-3 w-3" />
        </TagsInputItemDelete>
      </TagsInputItem>
      <TagsInputInput
        :placeholder="tags.length ? '' : (placeholder ?? 'Add tag…')"
        class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </TagsInputRoot>
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
