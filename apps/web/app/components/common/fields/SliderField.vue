<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef, computed } from 'vue';
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from 'reka-ui';

const props = defineProps<{
  name: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}>();

const { value, errorMessage } = useField<number>(toRef(props, 'name'));

const sliderValue = computed({
  get: () => [value.value ?? props.min ?? 0],
  set: (v: number[]) => {
    value.value = v[0];
  },
});
</script>

<template>
  <div class="space-y-2">
    <div v-if="label" class="flex items-center justify-between">
      <span class="text-sm font-medium leading-none">
        {{ label }}<span v-if="required" class="ml-0.5 text-destructive">*</span>
      </span>
      <span class="text-sm tabular-nums text-muted-foreground">{{ value ?? min ?? 0 }}</span>
    </div>
    <SliderRoot
      v-model="sliderValue"
      :min="min ?? 0"
      :max="max ?? 100"
      :step="step ?? 1"
      class="relative flex w-full touch-none select-none items-center"
    >
      <SliderTrack class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-input">
        <SliderRange class="absolute h-full bg-primary" />
      </SliderTrack>
      <SliderThumb
        class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderRoot>
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
