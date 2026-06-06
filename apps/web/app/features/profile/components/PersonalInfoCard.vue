<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-vue-next';
import type { User } from '@starterkit/shared-types';
import { useUpdateProfile } from '../composables/useProfile';

const props = defineProps<{ user: User }>();

const { t } = useI18n();

const editing = ref(false);
const update = useUpdateProfile();

const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
);

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { name: props.user.name },
});

function startEdit() {
  resetForm({ values: { name: props.user.name } });
  editing.value = true;
}

const onSubmit = handleSubmit(async (values) => {
  await update.mutateAsync({ name: values.name });
  editing.value = false;
});
</script>

<template>
  <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
    <div class="mb-5 flex items-center justify-between gap-3">
      <h3 class="text-base font-semibold text-foreground">
        {{ $t('profile.personalInfo.title') }}
      </h3>
      <Button v-if="!editing" variant="outline" size="sm" @click="startEdit">
        <Pencil class="h-4 w-4" />
        {{ $t('profile.personalInfo.edit') }}
      </Button>
    </div>

    <!-- Read-only view -->
    <dl v-if="!editing" class="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
      <div>
        <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {{ $t('profile.personalInfo.fullName') }}
        </dt>
        <dd class="mt-1 text-sm font-medium text-foreground">{{ user.name }}</dd>
      </div>
      <div>
        <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {{ $t('profile.personalInfo.emailAddress') }}
        </dt>
        <dd class="mt-1 text-sm font-medium text-foreground">{{ user.email }}</dd>
      </div>
      <div>
        <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {{ $t('profile.personalInfo.roles') }}
        </dt>
        <dd class="mt-1 flex flex-wrap gap-1.5">
          <Badge v-for="role in user.roles" :key="role" variant="muted">{{ role }}</Badge>
        </dd>
      </div>
    </dl>

    <!-- Edit form -->
    <form v-else class="space-y-5" @submit="onSubmit">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          name="name"
          :label="$t('profile.personalInfo.fullName')"
          placeholder="Your name"
        />
        <div class="space-y-1.5">
          <label class="text-sm font-medium leading-none text-foreground">{{
            $t('profile.personalInfo.emailAddress')
          }}</label>
          <Input :model-value="user.email" disabled class="cursor-not-allowed opacity-70" />
          <p class="text-xs text-muted-foreground">{{ $t('profile.personalInfo.emailHint') }}</p>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          :disabled="update.isPending.value"
          @click="editing = false"
        >
          {{ $t('profile.personalInfo.cancel') }}
        </Button>
        <Button type="submit" :disabled="update.isPending.value">
          {{
            update.isPending.value
              ? $t('profile.personalInfo.saving')
              : $t('profile.personalInfo.saveChanges')
          }}
        </Button>
      </div>
    </form>
  </div>
</template>
