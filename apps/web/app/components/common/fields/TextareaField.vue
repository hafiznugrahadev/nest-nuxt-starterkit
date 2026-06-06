<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef } from 'vue';
import { cn } from '~/lib/utils';

const props = defineProps<{
  name: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}>();

const { value, errorMessage } = useField<string>(toRef(props, 'name'));
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="name" class="text-sm font-medium leading-none">
      {{ label }}<span v-if="required" class="ml-0.5 text-destructive">*</span>
    </label>
    <textarea
      :id="name"
      v-model="value"
      :rows="rows ?? 4"
      :placeholder="placeholder"
      :class="
        cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          errorMessage && 'border-destructive focus-visible:ring-destructive',
        )
      "
    />
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
