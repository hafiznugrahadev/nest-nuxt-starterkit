<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { Goal } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

definePageMeta({ layout: 'default' });
useHead({ title: 'Login — Mini Soccer' });

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
    const redirect = (route.query.redirect as string) || '/bookings';
    await navigateTo(redirect);
  } catch {
    toast.error('Invalid email or password');
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <section class="mx-auto max-w-sm">
    <Card class="p-6">
      <div class="mb-6 flex flex-col items-center gap-2 text-center">
        <Goal class="h-8 w-8 text-primary" />
        <h1 class="text-xl font-bold tracking-tight">Sign in to {{ APP_NAME }}</h1>
        <p class="text-sm text-muted-foreground">Use your account to manage bookings.</p>
      </div>

      <form class="space-y-4" @submit="onSubmit">
        <TextField name="email" label="Email" type="email" placeholder="admin@minisoccer.test" />
        <TextField name="password" label="Password" type="password" placeholder="••••••••" />
        <Button type="submit" class="w-full" :disabled="submitting">
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </Button>
      </form>

      <p class="mt-4 text-center text-xs text-muted-foreground">
        Demo: admin@minisoccer.test / admin123
      </p>
    </Card>
  </section>
</template>
