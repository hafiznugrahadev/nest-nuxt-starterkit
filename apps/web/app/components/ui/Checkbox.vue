<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { Check } from 'lucide-vue-next';
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui';
import { cn } from '~/lib/utils';

// Mirrors shadcn-vue's new-york-v4 Checkbox. Their version omits `class` via
// @vueuse/core's reactiveOmit; Vue 3.5's reactive props rest-spread does the
// same without adding a dependency.
const { class: _c, ...delegatedProps } = defineProps<
  CheckboxRootProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<CheckboxRootEmits>();

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    data-slot="checkbox"
    v-bind="forwarded"
    :class="
      cn(
        'peer border-input data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
        _c,
      )
    "
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="grid place-content-center text-current transition-none"
    >
      <slot v-bind="slotProps">
        <Check class="size-3.5" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
