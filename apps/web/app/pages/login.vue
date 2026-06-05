<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

definePageMeta({ layout: 'auth' });
useHead({ title: `Sign In — ${APP_NAME}` });

const auth = useAuthStore();
const route = useRoute();
const submitting = ref(false);

// FE-only Zod schema (BE validates with class-validator). Mirrors LoginDto.
const schema = toTypedSchema(
  z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
);

const { handleSubmit } = useForm({ validationSchema: schema });

const onSubmit = handleSubmit(async (values) => {
  submitting.value = true;
  try {
    await auth.login(values.email, values.password);
    toast.success('Welcome back!');
    const redirect = (route.query.redirect as string) || '/';
    await navigateTo(redirect);
  } catch {
    toast.error('Invalid email or password');
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Sign In</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Enter your email and password to access your account.
      </p>
    </div>

    <form class="space-y-5" @submit="onSubmit">
      <TextField name="email" label="Email" type="email" placeholder="admin@starterkit.test" />
      <TextField name="password" label="Password" type="password" placeholder="••••••••" />
      <Button type="submit" size="lg" class="w-full" :disabled="submitting">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </Button>
    </form>

    <div class="mt-6 rounded-xl border border-border bg-muted/50 px-4 py-3 text-center">
      <p class="text-xs text-muted-foreground">
        Demo credentials —
        <span class="font-medium text-foreground">admin@starterkit.test</span> /
        <span class="font-medium text-foreground">admin123</span>
      </p>
    </div>
  </div>
</template>
