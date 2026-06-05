<script setup lang="ts">
import { computed } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useFields } from '~/features/field';
import { formatIDR } from '~/lib/utils';
import { bookingFormSchema } from '../schemas/booking.schema';
import { useCreateBooking } from '../composables/useBookings';

const emit = defineEmits<{ created: [] }>();

// Available fields populate the select (cross-feature import via the field barrel).
const { data: fieldsData } = useFields(() => ({ limit: 100, status: 'AVAILABLE' }));
const fieldOptions = computed(() =>
  (fieldsData.value?.data ?? []).map((f) => ({
    value: f.id,
    label: `${f.name} — ${formatIDR(f.pricePerHour)}/hr`,
  })),
);

const { handleSubmit, resetForm } = useForm({ validationSchema: toTypedSchema(bookingFormSchema) });
const create = useCreateBooking();

const onSubmit = handleSubmit(async (values) => {
  try {
    await create.mutateAsync(values);
    resetForm();
    emit('created');
  } catch {
    // Error toast handled centrally by useApiMutation.
  }
});
</script>

<template>
  <form class="space-y-4" @submit="onSubmit">
    <SelectField name="fieldId" label="Field" :options="fieldOptions" placeholder="Choose a field" />
    <TextField name="date" label="Date" type="date" />
    <div class="grid grid-cols-2 gap-3">
      <TextField name="startTime" label="Start" type="time" />
      <TextField name="endTime" label="End" type="time" />
    </div>
    <TextField name="notes" label="Notes (optional)" placeholder="e.g. weekly match" />
    <Button type="submit" class="w-full" :disabled="create.isPending.value">
      {{ create.isPending.value ? 'Saving…' : 'Create booking' }}
    </Button>
  </form>
</template>
