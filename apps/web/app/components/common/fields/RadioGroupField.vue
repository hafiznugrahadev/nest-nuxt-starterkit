<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef } from 'vue';
import { RadioGroupRoot, RadioGroupItem, RadioGroupIndicator } from 'reka-ui';

const props = defineProps<{
  name: string;
  label?: string;
  options: { label: string; value: string }[];
  required?: boolean;
}>();

const { value, errorMessage } = useField<string>(toRef(props, 'name'));
</script>

<template>
  <div class="space-y-1.5">
    <span v-if="label" class="text-sm font-medium leading-none">
      {{ label }}<span v-if="required" class="ml-0.5 text-destructive">*</span>
    </span>
    <RadioGroupRoot v-model="value" class="flex flex-col gap-2">
      <div v-for="opt in options" :key="opt.value" class="flex items-center gap-2">
        <RadioGroupItem
          :id="`${name}-${opt.value}`"
          :value="opt.value"
          class="aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RadioGroupIndicator class="flex items-center justify-center">
            <div class="h-2 w-2 rounded-full bg-primary" />
          </RadioGroupIndicator>
        </RadioGroupItem>
        <label :for="`${name}-${opt.value}`" class="cursor-pointer text-sm leading-none">
          {{ opt.label }}
        </label>
      </div>
    </RadioGroupRoot>
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
