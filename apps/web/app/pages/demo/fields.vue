<script setup lang="ts">
import { computed } from 'vue';
import { useForm, useFormValues } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { APP_NAME } from '~/lib/constants';

definePageMeta({ layout: 'dashboard', middleware: ['auth'] });
useHead({ title: `Fields Showcase — ${APP_NAME}` });

const schema = toTypedSchema(
  z.object({
    fullName: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Min 6 characters'),
    birthday: z.string().optional(),
    bio: z.string().optional(),
    role: z.string().min(1, 'Select a role'),
    status: z.string().min(1, 'Select a status'),
    permissions: z.array(z.string()).optional(),
    confidence: z.number().optional(),
    skills: z.array(z.string()).optional(),
    avatar: z.any().optional(),
    agreed: z.boolean().refine((v) => v === true, 'You must agree to the terms'),
    notifications: z.boolean().optional(),
  }),
);

const { handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    confidence: 50,
    notifications: false,
    agreed: false,
    permissions: [],
    skills: [],
  },
});

const rawValues = useFormValues();

const displayValues = computed(() => {
  const copy: Record<string, unknown> = { ...rawValues };
  if (copy.avatar instanceof File) copy.avatar = copy.avatar.name;
  return copy;
});

const onSubmit = handleSubmit(() => {
  toast.success('Form submitted successfully!');
});

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
];

const permissionOptions = [
  { label: 'Read', value: 'read' },
  { label: 'Write', value: 'write' },
  { label: 'Delete', value: 'delete' },
  { label: 'Manage Users', value: 'manage_users' },
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">Fields Showcase</h1>
      <p class="text-sm text-muted-foreground">
        All reusable form field components, integrated with VeeValidate.
      </p>
    </div>

    <form class="grid grid-cols-1 gap-6 lg:grid-cols-3" @submit="onSubmit">
      <!-- Left: fields -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Text Inputs -->
        <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Text Inputs
          </h2>
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField name="fullName" label="Full name" placeholder="John Doe" required />
              <TextField
                name="email"
                label="Email"
                type="email"
                placeholder="john@example.com"
                required
              />
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PasswordField name="password" label="Password" placeholder="••••••••" required />
              <DateField name="birthday" label="Birthday" />
            </div>
            <TextareaField
              name="bio"
              label="Bio"
              placeholder="Tell us a little about yourself…"
              :rows="3"
            />
          </div>
        </div>

        <!-- Selection -->
        <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Selection
          </h2>
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                name="role"
                label="Role"
                :options="roleOptions"
                placeholder="Choose a role…"
                required
              />
              <SelectField
                name="permissions"
                label="Permissions"
                :options="permissionOptions"
                placeholder="Choose permissions…"
                multiple
              />
            </div>
            <RadioGroupField name="status" label="Status" :options="statusOptions" required />
          </div>
        </div>

        <!-- Boolean Controls -->
        <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Boolean Controls
          </h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CheckboxField name="agreed" label="I agree to the terms and conditions" required />
            <SwitchField name="notifications" label="Email notifications" />
          </div>
        </div>

        <!-- Specialized -->
        <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Specialized
          </h2>
          <div class="space-y-4">
            <SliderField name="confidence" label="Confidence level" :min="0" :max="100" :step="5" />
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TagInputField name="skills" label="Skills" placeholder="Type and press Enter…" />
              <FileField
                name="avatar"
                label="Avatar"
                accept="image/*"
                placeholder="No image chosen"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" size="lg">Submit form</Button>
        </div>
      </div>

      <!-- Right: live values -->
      <div class="lg:col-span-1">
        <div
          class="sticky top-6 rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6"
        >
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Live values
          </h2>
          <pre
            class="max-h-[calc(100vh-12rem)] overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed text-foreground"
            >{{ JSON.stringify(displayValues, null, 2) }}</pre
          >
        </div>
      </div>
    </form>
  </div>
</template>
