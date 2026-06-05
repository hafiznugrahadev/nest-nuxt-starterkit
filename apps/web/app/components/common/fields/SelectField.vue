<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef } from 'vue';
import { cn } from '~/lib/utils';

const props = defineProps<{
  name: string;
  label?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}>();

const { value, errorMessage } = useField<string>(toRef(props, 'name'));
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="name" class="text-sm font-medium leading-none">{{ label }}</label>
    <select
      :id="name"
      v-model="value"
      :class="
        cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          errorMessage && 'border-destructive focus-visible:ring-destructive',
        )
      "
    >
      <option value="" disabled>{{ placeholder ?? 'Select…' }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
