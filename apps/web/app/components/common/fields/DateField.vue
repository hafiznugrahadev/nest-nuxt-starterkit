<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef } from 'vue';
import { cn } from '~/lib/utils';

const props = defineProps<{
  name: string;
  label?: string;
  min?: string;
  max?: string;
  required?: boolean;
}>();

const { value, errorMessage } = useField<string>(toRef(props, 'name'));
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="name" class="text-sm font-medium leading-none">
      {{ label }}<span v-if="required" class="ml-0.5 text-destructive">*</span>
    </label>
    <input
      :id="name"
      v-model="value"
      type="date"
      :min="min"
      :max="max"
      :class="
        cn(
          'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
          errorMessage && 'border-destructive focus:border-destructive focus:ring-destructive/20',
        )
      "
    />
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
