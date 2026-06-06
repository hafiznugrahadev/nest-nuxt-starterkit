<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef } from 'vue';
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui';
import { Check } from 'lucide-vue-next';

const props = defineProps<{
  name: string;
  label?: string;
  required?: boolean;
}>();

const { value, errorMessage } = useField<boolean>(toRef(props, 'name'));
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center gap-2">
      <CheckboxRoot
        :id="name"
        v-model:checked="value"
        class="peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      >
        <CheckboxIndicator class="flex items-center justify-center text-current">
          <Check class="h-3.5 w-3.5" />
        </CheckboxIndicator>
      </CheckboxRoot>
      <label
        v-if="label"
        :for="name"
        class="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {{ label }}<span v-if="required" class="ml-0.5 text-destructive">*</span>
      </label>
    </div>
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
