<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        // Polygon status pills: tinted surface + status ink. warning-foreground
        // is ink (#1f1f1f) — amber text on amber tint fails contrast.
        success: 'border-transparent bg-success/10 text-success',
        warning: 'border-transparent bg-warning/15 text-warning-foreground',
        info: 'border-transparent bg-info/10 text-info',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type BadgeVariants = VariantProps<typeof badgeVariants>;
const props = defineProps<{ variant?: BadgeVariants['variant']; class?: string }>();
</script>

<template>
  <span :class="cn(badgeVariants({ variant }), props.class)"><slot /></span>
</template>
