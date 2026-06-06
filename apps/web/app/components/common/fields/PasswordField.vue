<script setup lang="ts">
import { useField } from 'vee-validate';
import { toRef, ref } from 'vue';
import { cn } from '~/lib/utils';
import { Eye, EyeOff } from 'lucide-vue-next';

const props = defineProps<{
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}>();

const { value, errorMessage } = useField<string>(toRef(props, 'name'));
const show = ref(false);
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="name" class="text-sm font-medium leading-none">
      {{ label }}<span v-if="required" class="ml-0.5 text-destructive">*</span>
    </label>
    <div class="relative">
      <Input
        :id="name"
        v-model="value"
        :type="show ? 'text' : 'password'"
        :placeholder="placeholder"
        :class="cn('pr-10', errorMessage && 'border-destructive focus-visible:ring-destructive')"
      />
      <button
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        :aria-label="show ? 'Hide password' : 'Show password'"
        @click="show = !show"
      >
        <Eye v-if="show" class="h-4 w-4" />
        <EyeOff v-else class="h-4 w-4" />
      </button>
    </div>
    <p v-if="errorMessage" class="text-xs text-destructive">{{ errorMessage }}</p>
  </div>
</template>
