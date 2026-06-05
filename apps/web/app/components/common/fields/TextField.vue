<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef } from 'vue';
import { cn } from '~/lib/utils';

/**
 * SPEC DRY #2 (FE) — label + input + error, integrated via VeeValidate `useField`.
 * Must be used inside a VeeValidate form (`useForm` / `<Form>`).
 */
const props = defineProps<{
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
}>();

const { value, errorMessage } = useField<string>(toRef(props, 'name'));
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label || $slots.label" :for="name" class="text-sm font-medium leading-none">
      <slot name="label">{{ label }}</slot>
    </label>
    <Input
      :id="name"
      v-model="value"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :class="cn(errorMessage && 'border-destructive focus-visible:ring-destructive')"
    />
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
