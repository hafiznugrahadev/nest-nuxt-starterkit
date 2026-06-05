<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from 'lucide-vue-next';
// Explicit barrel import — features/ is NOT auto-imported (SPEC boundary rule).
import { BookingTable, BookingForm } from '~/features/booking';

definePageMeta({ layout: 'dashboard', middleware: 'auth' });
useHead({ title: 'Bookings — Mini Soccer' });

const showForm = ref(false);

function onCreated() {
  showForm.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p class="text-sm text-muted-foreground">Your reserved field slots.</p>
      </div>
      <Button size="sm" @click="showForm = !showForm">
        <Plus class="h-4 w-4" />
        New booking
      </Button>
    </div>

    <Card v-if="showForm" class="p-6">
      <h2 class="mb-4 text-lg font-semibold">Create a booking</h2>
      <BookingForm @created="onCreated" />
    </Card>

    <BookingTable />
  </div>
</template>
