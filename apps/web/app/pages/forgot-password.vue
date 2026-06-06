<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { MailCheck } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { APP_NAME } from '~/lib/constants';

definePageMeta({ layout: 'auth' });
const { t } = useI18n();
useHead({ title: `Forgot Password — ${APP_NAME}` });

const auth = useAuthStore();
const submitting = ref(false);
const sent = ref(false);

const schema = toTypedSchema(z.object({ email: z.string().email('Enter a valid email') }));
const { handleSubmit } = useForm({ validationSchema: schema });

const onSubmit = handleSubmit(async (values) => {
  submitting.value = true;
  try {
    await auth.forgotPassword(values.email);
    sent.value = true;
  } catch {
    toast.error(t('auth.somethingWrong'));
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {{ $t('auth.forgotTitle') }}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">{{ $t('auth.forgotSubtitle') }}</p>
    </div>

    <!-- Success state -->
    <div v-if="sent" class="space-y-4 rounded-xl border border-border bg-muted/40 p-5 text-center">
      <span
        class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15"
      >
        <MailCheck class="h-5 w-5" />
      </span>
      <p class="text-sm text-foreground">{{ $t('auth.resetLinkSent') }}</p>
      <NuxtLink to="/login" class="inline-block text-sm font-medium text-primary hover:underline">
        {{ $t('auth.backToSignIn') }}
      </NuxtLink>
    </div>

    <!-- Request form -->
    <form v-else class="space-y-5" @submit="onSubmit">
      <TextField
        name="email"
        :label="$t('auth.email')"
        type="email"
        placeholder="info@gmail.com"
        required
      />
      <Button type="submit" size="lg" class="h-11 w-full" :disabled="submitting">
        {{ submitting ? $t('auth.sending') : $t('auth.sendResetLink') }}
      </Button>
      <p class="text-center text-sm text-muted-foreground">
        {{ $t('auth.rememberedIt') }}
        <NuxtLink to="/login" class="font-medium text-primary hover:underline">
          {{ $t('auth.signIn') }}
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
