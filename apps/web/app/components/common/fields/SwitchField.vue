<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef } from 'vue';
import { SwitchRoot, SwitchThumb } from 'reka-ui';

const props = defineProps<{
  name: string;
  label?: string;
  required?: boolean;
}>();

const { value, errorMessage } = useField<boolean>(toRef(props, 'name'));
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center gap-3">
      <SwitchRoot
        :id="name"
        v-model:checked="value"
        class="peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
      >
        <SwitchThumb
          class="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        />
      </SwitchRoot>
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
